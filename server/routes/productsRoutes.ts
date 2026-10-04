import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole } from '../auth';

export const productsRouter = Router();

// Lấy danh sách sản phẩm kèm tổng số lượng tồn kho tính từ các lô
productsRouter.get('/', async (req, res) => {
  try {
    const { branchId, category, search } = req.query;

    let query = `
      SELECT p.*,
        COALESCE(
          (SELECT SUM(sb.quantity)
           FROM stock_batches sb
           WHERE sb.product_id = p.id
             ${branchId && branchId !== 'all' ? `AND sb.branch_id = '${branchId}'` : ''}
          ), 0
        ) as total_stock
      FROM products p
      WHERE 1=1
    `;

    const args: any[] = [];

    if (category && category !== 'all') {
      query += ' AND p.category = ?';
      args.push(category);
    }

    if (search) {
      query += ' AND (LOWER(p.name) LIKE ? OR p.barcode LIKE ? OR LOWER(p.manufacturer) LIKE ?)';
      const s = `%${String(search).toLowerCase().trim()}%`;
      args.push(s, s, s);
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await db.execute({ sql: query, args });

    const products = result.rows.map((row) => ({
      id: row.id,
      barcode: row.barcode,
      name: row.name,
      category: row.category,
      manufacturer: row.manufacturer,
      unitSize: row.unit_size,
      costPrice: Number(row.cost_price),
      sellingPrice: Number(row.selling_price),
      shelfLocation: {
        zone: row.shelf_zone || 'Khu Trưng Bày',
        aisle: row.shelf_aisle || 'Dãy 01',
        shelf: row.shelf_code || 'Kệ A1-01',
      },
      storageCondition: row.storage_condition,
      minStockThreshold: Number(row.min_stock_threshold) || 10,
      imageUrl: row.image_url,
      totalStock: Number(row.total_stock) || 0,
    }));

    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách sản phẩm: ' + error.message });
  }
});

// Thêm sản phẩm mới (Store Manager, Warehouse Manager, Admin)
productsRouter.post('/', authenticateToken, requireRole(['admin', 'store_manager', 'warehouse_manager']), async (req, res) => {
  try {
    const { barcode, name, category, manufacturer, unitSize, costPrice, sellingPrice, shelfLocation, storageCondition, minStockThreshold, imageUrl } = req.body;

    if (!barcode || !name) {
      res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ tên và mã vạch sản phẩm.' });
      return;
    }

    const check = await db.execute({
      sql: 'SELECT id FROM products WHERE barcode = ?',
      args: [String(barcode).trim()],
    });

    if (check.rows.length > 0) {
      res.status(400).json({ error: `Mã vạch "${barcode}" đã tồn tại trên một sản phẩm khác.` });
      return;
    }

    const newId = 'prod-' + Date.now();

    await db.execute({
      sql: `INSERT INTO products (id, barcode, name, category, manufacturer, unit_size, cost_price, selling_price, shelf_zone, shelf_aisle, shelf_code, storage_condition, min_stock_threshold, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        newId,
        String(barcode).trim(),
        String(name).trim(),
        category || 'vegetable',
        manufacturer ? String(manufacturer).trim() : '',
        unitSize ? String(unitSize).trim() : 'Gói 500g',
        Number(costPrice) || 0,
        Number(sellingPrice) || 0,
        shelfLocation?.zone || 'Khu Trưng Bày',
        shelfLocation?.aisle || 'Dãy 01',
        shelfLocation?.shelf || 'Kệ A1-01',
        storageCondition || 'Nhiệt độ phòng',
        Number(minStockThreshold) || 10,
        imageUrl || '',
      ],
    });

    res.status(201).json({
      success: true,
      message: `Đã thêm sản phẩm "${name}" thành công.`,
      product: {
        id: newId,
        barcode,
        name,
        category,
        manufacturer,
        unitSize,
        costPrice,
        sellingPrice,
        shelfLocation,
        storageCondition,
        minStockThreshold,
        imageUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi thêm sản phẩm: ' + error.message });
  }
});

// Cập nhật sản phẩm
productsRouter.put('/:id', authenticateToken, requireRole(['admin', 'store_manager', 'warehouse_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { barcode, name, category, manufacturer, unitSize, costPrice, sellingPrice, shelfLocation, storageCondition, minStockThreshold, imageUrl } = req.body;

    const exist = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
    if (exist.rows.length === 0) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm cần cập nhật.' });
      return;
    }

    await db.execute({
      sql: `UPDATE products
            SET barcode = ?, name = ?, category = ?, manufacturer = ?, unit_size = ?, cost_price = ?, selling_price = ?,
                shelf_zone = ?, shelf_aisle = ?, shelf_code = ?, storage_condition = ?, min_stock_threshold = ?, image_url = ?
            WHERE id = ?`,
      args: [
        String(barcode).trim(),
        String(name).trim(),
        category,
        manufacturer ? String(manufacturer).trim() : '',
        unitSize ? String(unitSize).trim() : '',
        Number(costPrice),
        Number(sellingPrice),
        shelfLocation?.zone || 'Khu Trưng Bày',
        shelfLocation?.aisle || 'Dãy 01',
        shelfLocation?.shelf || 'Kệ A1-01',
        storageCondition || '',
        Number(minStockThreshold) || 10,
        imageUrl || '',
        id,
      ],
    });

    res.json({
      success: true,
      message: `Đã cập nhật sản phẩm "${name}" thành công.`,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi cập nhật sản phẩm: ' + error.message });
  }
});

// Xóa sản phẩm
productsRouter.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem sản phẩm có hóa đơn nào liên kết không
    const checkInvoice = await db.execute({ sql: 'SELECT COUNT(*) as count FROM invoice_items WHERE product_id = ?', args: [id] });
    if (Number(checkInvoice.rows[0].count) > 0) {
      res.status(400).json({ error: 'Không thể xóa sản phẩm này vì đã phát sinh lịch sử trong hóa đơn bán hàng.' });
      return;
    }

    // Xóa các lô kho liên kết
    await db.execute({ sql: 'DELETE FROM stock_batches WHERE product_id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] });

    res.json({ success: true, message: 'Đã xóa sản phẩm thành công.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi xóa sản phẩm: ' + error.message });
  }
});
