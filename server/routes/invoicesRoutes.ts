import { Router } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, authenticateToken } from '../auth';

export const invoicesRouter = Router();

// Lấy danh sách hóa đơn bán hàng
invoicesRouter.get('/', async (req, res) => {
  try {
    const { branchId, date, status } = req.query;

    let query = 'SELECT * FROM invoices WHERE 1=1';
    const args: any[] = [];

    if (branchId && branchId !== 'all') {
      query += ' AND branch_id = ?';
      args.push(branchId);
    }

    if (status) {
      query += ' AND status = ?';
      args.push(status);
    }

    if (date) {
      query += ' AND created_at LIKE ?';
      args.push(`${date}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await db.execute({ sql: query, args });

    // Lấy items cho mỗi hóa đơn
    const invoices = [];
    for (const row of result.rows) {
      const itemsResult = await db.execute({
        sql: 'SELECT * FROM invoice_items WHERE invoice_id = ?',
        args: [row.id],
      });

      const items = itemsResult.rows.map((it) => ({
        productId: it.product_id,
        productName: it.product_name,
        barcode: it.barcode,
        unitSize: it.unit_size,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unit_price),
        discount: Number(it.discount),
        total: Number(it.total),
        batches: it.batches_json ? JSON.parse(String(it.batches_json)) : [],
      }));

      invoices.push({
        id: row.id,
        code: row.code,
        clientId: row.client_id,
        branchId: row.branch_id,
        cashierId: row.cashier_id,
        cashierName: row.cashier_name,
        cashierRole: row.cashier_role,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        subtotal: Number(row.subtotal),
        discountTotal: Number(row.discount_total),
        appliedPromotionCode: row.applied_promotion_code,
        finalTotal: Number(row.final_total),
        paymentMethod: row.payment_method,
        cashGiven: row.cash_given ? Number(row.cash_given) : undefined,
        changeReturn: row.change_return ? Number(row.change_return) : undefined,
        paymentRef: row.payment_ref,
        status: row.status,
        cancelReason: row.cancel_reason,
        isOfflineSync: Boolean(row.is_offline_sync),
        stockConflict: Boolean(row.stock_conflict),
        createdAt: row.created_at,
        items,
      });
    }

    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách hóa đơn: ' + error.message });
  }
});

// Tạo đơn hàng mới trực tiếp (Online Checkout với trừ kho FEFO)
invoicesRouter.post('/', async (req, res) => {
  try {
    const {
      code,
      clientId,
      branchId,
      cashierName,
      cashierRole,
      customerName,
      customerPhone,
      items,
      subtotal,
      discountTotal,
      appliedPromotionCode,
      finalTotal,
      paymentMethod,
      cashGiven,
      changeReturn,
      paymentRef,
    } = req.body;

    if (!items || !items.length || !branchId || !code) {
      res.status(400).json({ error: 'Dữ liệu đơn hàng không hợp lệ hoặc giỏ hàng trống.' });
      return;
    }

    const invoiceId = 'inv-' + Date.now();
    const finalClientId = clientId || invoiceId;
    const createdAt = new Date().toISOString();

    // 1. Phân bổ và trừ kho theo FEFO cho từng sản phẩm
    const processedItems = [];

    for (const item of items) {
      let neededQty = Number(item.quantity);
      const allocatedBatches = [];

      // Lấy các lô còn hàng sắp xếp theo FEFO (expiry_date ASC)
      const batchesResult = await db.execute({
        sql: `SELECT id, batch_code, quantity, expiry_date
              FROM stock_batches
              WHERE product_id = ? AND branch_id = ? AND quantity > 0
              ORDER BY expiry_date ASC, received_at ASC`,
        args: [item.productId, branchId],
      });

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
        ...item,
        batches: allocatedBatches,
      });
    }

    // 2. Lưu hóa đơn vào bảng invoices
    await db.execute({
      sql: `INSERT INTO invoices (id, code, client_id, branch_id, cashier_name, cashier_role, customer_name, customer_phone, subtotal, discount_total, applied_promotion_code, final_total, payment_method, cash_given, change_return, payment_ref, status, is_offline_sync, stock_conflict, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', 0, 0, ?)`,
      args: [
        invoiceId,
        code,
        finalClientId,
        branchId,
        cashierName || 'Thu Ngân',
        cashierRole || 'sales_staff',
        customerName || 'Khách Vãng Lai',
        customerPhone || '',
        Number(subtotal),
        Number(discountTotal) || 0,
        appliedPromotionCode || null,
        Number(finalTotal),
        paymentMethod,
        cashGiven ? Number(cashGiven) : null,
        changeReturn ? Number(changeReturn) : null,
        paymentRef || null,
        createdAt,
      ],
    });

    // 3. Lưu chi tiết từng món vào invoice_items
    for (const it of processedItems) {
      const itemId = 'item-' + Math.random().toString(36).substr(2, 9);
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

    res.status(201).json({
      success: true,
      message: 'Đơn hàng đã được thanh toán và cập nhật kho FEFO thành công.',
      invoiceId,
      code,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi tạo hóa đơn: ' + error.message });
  }
});

// Hủy đơn hàng và hoàn trả số lượng vào kho FEFO
invoicesRouter.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const exist = await db.execute({ sql: 'SELECT * FROM invoices WHERE id = ?', args: [id] });
    if (exist.rows.length === 0) {
      res.status(404).json({ error: 'Không tìm thấy hóa đơn cần hủy.' });
      return;
    }

    if (exist.rows[0].status === 'cancelled') {
      res.status(400).json({ error: 'Hóa đơn này đã được hủy trước đó.' });
      return;
    }

    // Lấy danh sách items để hoàn trả số lượng lô kho
    const itemsResult = await db.execute({ sql: 'SELECT * FROM invoice_items WHERE invoice_id = ?', args: [id] });

    for (const item of itemsResult.rows) {
      if (item.batches_json) {
        const allocatedBatches = JSON.parse(String(item.batches_json));
        for (const b of allocatedBatches) {
          await db.execute({
            sql: 'UPDATE stock_batches SET quantity = quantity + ? WHERE id = ?',
            args: [Number(b.quantity), b.batchId],
          });
        }
      }
    }

    await db.execute({
      sql: `UPDATE invoices SET status = 'cancelled', cancel_reason = ? WHERE id = ?`,
      args: [reason || 'Khách trả hàng / hoàn tiền', id],
    });

    res.json({
      success: true,
      message: `Đã hủy hóa đơn "${exist.rows[0].code}" và hoàn trả tồn kho FEFO thành công.`,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi hủy hóa đơn: ' + error.message });
  }
});
