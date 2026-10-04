import { Router } from 'express';
import { db } from '../db';

export const reportsRouter = Router();

// Thống kê tổng quan hệ thống
reportsRouter.get('/summary', async (req, res) => {
  try {
    const { branchId } = req.query;

    let branchFilter = '';
    if (branchId && branchId !== 'all') {
      branchFilter = `WHERE branch_id = '${branchId}'`;
    }

    // Doanh thu và số lượng đơn hoàn thành
    const revenueRes = await db.execute(`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(final_total), 0) as total_revenue,
        COALESCE(SUM(discount_total), 0) as total_discount
      FROM invoices
      ${branchFilter ? `${branchFilter} AND status = 'completed'` : "WHERE status = 'completed'"}
    `);

    // Số lượng sản phẩm
    const prodRes = await db.execute('SELECT COUNT(*) as total_products FROM products');

    // Thống kê lô kho (sắp hết hạn < 7 ngày hoặc quá hạn so với ngày giả lập 2026-10-04)
    const batchesRes = await db.execute(`
      SELECT
        COUNT(*) as total_batches,
        COALESCE(SUM(quantity), 0) as total_stock_items,
        COALESCE(SUM(quantity * cost_price), 0) as total_stock_value,
        SUM(CASE WHEN expiry_date < '2026-10-04' THEN 1 ELSE 0 END) as expired_batches,
        SUM(CASE WHEN expiry_date >= '2026-10-04' AND expiry_date <= '2026-10-11' THEN 1 ELSE 0 END) as expiring_soon_batches
      FROM stock_batches
      ${branchFilter}
    `);

    // Số lượng đơn đồng bộ ngoại tuyến & lệch kho
    const syncRes = await db.execute(`
      SELECT
        SUM(CASE WHEN is_offline_sync = 1 THEN 1 ELSE 0 END) as offline_sync_count,
        SUM(CASE WHEN stock_conflict = 1 THEN 1 ELSE 0 END) as conflict_count
      FROM invoices
      ${branchFilter}
    `);

    res.json({
      totalRevenue: Number(revenueRes.rows[0]?.total_revenue || 0),
      totalOrders: Number(revenueRes.rows[0]?.total_orders || 0),
      totalDiscount: Number(revenueRes.rows[0]?.total_discount || 0),
      totalProducts: Number(prodRes.rows[0]?.total_products || 0),
      totalBatches: Number(batchesRes.rows[0]?.total_batches || 0),
      totalStockItems: Number(batchesRes.rows[0]?.total_stock_items || 0),
      totalStockValue: Number(batchesRes.rows[0]?.total_stock_value || 0),
      expiredBatches: Number(batchesRes.rows[0]?.expired_batches || 0),
      expiringSoonBatches: Number(batchesRes.rows[0]?.expiring_soon_batches || 0),
      offlineSyncCount: Number(syncRes.rows[0]?.offline_sync_count || 0),
      conflictCount: Number(syncRes.rows[0]?.conflict_count || 0),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi tổng hợp báo cáo: ' + error.message });
  }
});

// Doanh thu theo từng chi nhánh
reportsRouter.get('/by-branch', async (_req, res) => {
  try {
    const result = await db.execute(`
      SELECT
        b.id,
        b.code,
        b.name,
        COALESCE(COUNT(i.id), 0) as order_count,
        COALESCE(SUM(CASE WHEN i.status = 'completed' THEN i.final_total ELSE 0 END), 0) as revenue
      FROM branches b
      LEFT JOIN invoices i ON b.id = i.branch_id
      GROUP BY b.id, b.code, b.name
      ORDER BY revenue DESC
    `);

    const branches = result.rows.map((r) => ({
      branchId: r.id,
      branchCode: r.code,
      branchName: r.name,
      orderCount: Number(r.order_count),
      revenue: Number(r.revenue),
    }));

    res.json(branches);
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi thống kê doanh thu chi nhánh: ' + error.message });
  }
});
