import { Router } from 'express';
import { db } from '../db';

export const syncRouter = Router();

// Endpoint Batch Sync Idempotent xử lý hàng đợi Outbox ngoại tuyến
syncRouter.post('/outbox', async (req, res) => {
  try {
    const { outboxItems } = req.body;

    if (!Array.isArray(outboxItems) || outboxItems.length === 0) {
      res.json({ success: true, syncedCount: 0, syncedIds: [], conflicts: [] });
      return;
    }

    const syncedIds: string[] = [];
    const conflicts: Array<{ clientId: string; code: string; reason: string }> = [];

    for (const item of outboxItems) {
      const inv = item.invoice;
      const clientId = item.clientId || inv.clientId || inv.id;

      // 1. Kiểm tra tính Idempotent: Nếu clientId đã tồn tại trên server thì xem như đã đồng bộ
      const existCheck = await db.execute({
        sql: 'SELECT id, code FROM invoices WHERE client_id = ?',
        args: [clientId],
      });

      if (existCheck.rows.length > 0) {
        syncedIds.push(item.id);
        continue;
      }

      // 2. Kiểm tra xung đột tồn kho theo lô FEFO
      let hasConflict = false;
      const processedItems = [];

      for (const it of inv.items || []) {
        let neededQty = Number(it.quantity);
        const allocatedBatches = [];

        // Lấy các lô kho tại chi nhánh theo FEFO
        const batchesResult = await db.execute({
          sql: `SELECT id, batch_code, quantity, expiry_date
                FROM stock_batches
                WHERE product_id = ? AND branch_id = ? AND quantity > 0
                ORDER BY expiry_date ASC, received_at ASC`,
          args: [it.productId, inv.branchId],
        });

        let totalAvailable = batchesResult.rows.reduce((sum, b) => sum + Number(b.quantity), 0);

        if (totalAvailable < neededQty) {
          hasConflict = true;
        }

        for (const b of batchesResult.rows) {
          if (neededQty <= 0) break;
          const available = Number(b.quantity);
          const take = Math.min(available, neededQty);

          allocatedBatches.push({
            batchId: b.id,
            batchCode: b.batch_code,
            quantity: take,
            expiryDate: b.expiry_date,
          });

          // Trừ số lượng trong lô kho
          await db.execute({
            sql: 'UPDATE stock_batches SET quantity = quantity - ? WHERE id = ?',
            args: [take, b.id],
          });

          neededQty -= take;
        }

        processedItems.push({
          ...it,
          batches: allocatedBatches,
        });
      }

      // 3. Lưu hóa đơn vào CSDL SQLite
      const invoiceId = 'inv-sync-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

      await db.execute({
        sql: `INSERT INTO invoices (id, code, client_id, branch_id, cashier_name, cashier_role, customer_name, customer_phone, subtotal, discount_total, applied_promotion_code, final_total, payment_method, cash_given, change_return, payment_ref, status, is_offline_sync, stock_conflict, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        args: [
          invoiceId,
          inv.code,
          clientId,
          inv.branchId,
          inv.cashierName || 'Thu Ngân Offline',
          inv.cashierRole || 'sales_staff',
          inv.customerName || 'Khách Hàng',
          inv.customerPhone || '',
          Number(inv.subtotal),
          Number(inv.discountTotal) || 0,
          inv.appliedPromotionCode || null,
          Number(inv.finalTotal),
          inv.paymentMethod,
          inv.cashGiven ? Number(inv.cashGiven) : null,
          inv.changeReturn ? Number(inv.changeReturn) : null,
          inv.paymentRef || null,
          inv.status || 'completed',
          hasConflict ? 1 : 0,
          inv.createdAt || new Date().toISOString(),
        ],
      });

      // 4. Lưu chi tiết sản phẩm hóa đơn
      for (const it of processedItems) {
        const itemId = 'item-sync-' + Math.random().toString(36).substr(2, 9);
        await db.execute({
          sql: `INSERT INTO invoice_items (id, invoice_id, product_id, product_name, barcode, unit_size, quantity, unit_price, discount, total, batches_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            itemId,
            invoiceId,
            it.productId,
            it.productName,
            it.barcode || '',
            it.unitSize || '',
            Number(it.quantity),
            Number(it.unitPrice),
            Number(it.discount) || 0,
            Number(it.total),
            JSON.stringify(it.batches || []),
          ],
        });
      }

      if (hasConflict) {
        conflicts.push({
          clientId,
          code: inv.code,
          reason: 'Số lượng tồn kho thực tế của chi nhánh thấp hơn số lượng bán ngoại tuyến (Đã ghi nhận cờ lệch kho stock_conflict để thủ kho kiểm tra).',
        });
      }

      syncedIds.push(item.id);
    }

    res.json({
      success: true,
      message: `Đã đồng bộ thành công ${syncedIds.length} giao dịch từ Outbox ngoại tuyến lên máy chủ.`,
      syncedCount: syncedIds.length,
      syncedIds,
      conflicts,
    });
  } catch (error: any) {
    console.error('Outbox sync error:', error);
    res.status(500).json({ error: 'Lỗi trong quá trình đồng bộ Outbox: ' + error.message });
  }
});
