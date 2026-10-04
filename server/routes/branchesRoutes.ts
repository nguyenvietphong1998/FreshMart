import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole } from '../auth';

export const branchesRouter = Router();

branchesRouter.get('/', async (_req, res) => {
  try {
    const result = await db.execute('SELECT * FROM branches ORDER BY code ASC');
    const branches = result.rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      address: row.address,
      phone: row.phone,
      coordinates: {
        lat: Number(row.lat),
        lng: Number(row.lng),
      },
      managerName: row.manager_name,
    }));
    res.json(branches);
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách chi nhánh: ' + error.message });
  }
});

branchesRouter.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { code, name, address, phone, coordinates, managerName } = req.body;
    if (!code || !name || !address) {
      res.status(400).json({ error: 'Vui lòng cung cấp mã, tên và địa chỉ chi nhánh.' });
      return;
    }

    const newId = 'branch-' + Date.now();
    await db.execute({
      sql: 'INSERT INTO branches (id, code, name, address, phone, lat, lng, manager_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [newId, code, name, address, phone || '', coordinates?.lat || 0, coordinates?.lng || 0, managerName || ''],
    });

    res.status(201).json({
      success: true,
      message: `Đã thêm chi nhánh "${name}" thành công.`,
      branch: {
        id: newId,
        code,
        name,
        address,
        phone,
        coordinates,
        managerName,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi thêm chi nhánh: ' + error.message });
  }
});
