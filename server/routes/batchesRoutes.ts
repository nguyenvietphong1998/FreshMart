import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole } from '../auth';

export const batchesRouter = Router();

// Lấy danh sách lô kho sắp xếp theo FEFO (ngày hết hạn sớm nhất lên đầu)
batchesRouter.get('/', async (req, res) => {
  try {
    const { branchId, productId, filter } = req.query;

    let query = `
      SELECT sb.*, p.name as product_name, p.barcode as product_barcode, p.category as product_category, p.unit_size as product_unit_size
      FROM stock_batches sb
      JOIN products p ON sb.product_id = p.id
      WHERE 1=1
    `;
    const args: any[] = [];

    if (branchId && branchId !== 'all') {
      query += ' AND sb.branch_id = ?';
      args.push(branchId);
    }

    if (productId) {
      query += ' AND sb.product_id = ?';
      args.push(productId);
    }

    // FEFO: sắp xếp ngày hết hạn tăng dần (First-Expired-First-Out)
    query += ' ORDER BY sb.expiry_date ASC, sb.received_at ASC';

    const result = await db.execute({ sql: query, args });

    const batches = result.rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      productBarcode: row.product_barcode,
      productCategory: row.product_category,
      productUnitSize: row.product_unit_size,
      branchId: row.branch_id,
      batchCode: row.batch_code,
      quantity: Number(row.quantity),
      costPrice: Number(row.cost_price),
      expiryDate: row.expiry_date,
      receivedAt: row.received_at,
    }));

    res.json(batches);
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách lô kho: ' + error.message });
  }
});

// Nhập lô hàng mới
batchesRouter.post('/', authenticateToken, requireRole(['admin', 'store_manager', 'warehouse_manager']), async (req, res) => {
  try {
    const { productId, branchId, batchCode, quantity, costPrice, expiryDate, receivedAt } = req.body;

    if (!productId || !batchCode || quantity === undefined || !expiryDate) {
      res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin sản phẩm, mã lô, số lượng và hạn dùng.' });
      return;
    }

    const newId = 'batch-' + Date.now();

    await db.execute({
      sql: `INSERT INTO stock_batches (id, product_id, branch_id, batch_code, quantity, cost_price, expiry_date, received_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        newId,
        productId,
        branchId || 'branch-hcm-01',
        String(batchCode).trim(),
        Math.max(0, Number(quantity)),
        Number(costPrice) || 0,
        expiryDate,
        receivedAt || new Date().toISOString().split('T')[0],
      ],
    });

    res.status(201).json({
      success: true,
      message: `Đã nhập lô hàng "${batchCode}" vào kho thành công.`,
      batch: {
        id: newId,
        productId,
        branchId,
        batchCode,
        quantity: Number(quantity),
        costPrice: Number(costPrice) || 0,
        expiryDate,
        receivedAt: receivedAt || new Date().toISOString().split('T')[0],
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi nhập lô hàng: ' + error.message });
  }
});

// Điều chỉnh số lượng lô kho
batchesRouter.patch('/:id/adjust', authenticateToken, requireRole(['admin', 'store_manager', 'warehouse_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { newQuantity, reason } = req.body;

    if (newQuantity === undefined) {
      res.status(400).json({ error: 'Vui lòng cung cấp số lượng mới.' });
      return;
    }

    await db.execute({
      sql: 'UPDATE stock_batches SET quantity = ? WHERE id = ?',
      args: [Math.max(0, Number(newQuantity)), id],
    });

    res.json({
      success: true,
      message: `Đã điều chỉnh tồn kho thành công (${reason || 'Kiểm kê kho'}).`,
      batchId: id,
      newQuantity: Math.max(0, Number(newQuantity)),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi điều chỉnh lô kho: ' + error.message });
  }
});
