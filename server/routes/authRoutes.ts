import { Router } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, authenticateToken, generateToken } from '../auth';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu.' });
      return;
    }

    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE LOWER(username) = LOWER(?)',
      args: [username.trim()],
    });

    if (result.rows.length === 0) {
      res.status(401).json({ error: `Tài khoản "${username}" không tồn tại trên hệ thống.` });
      return;
    }

    const userRow = result.rows[0];

    if (userRow.status === 'inactive') {
      res.status(403).json({ error: 'Tài khoản này đang bị khóa tạm thời. Vui lòng liên hệ Admin.' });
      return;
    }

    // Kiểm tra mật khẩu (hỗ trợ cả plain text demo và so khớp)
    if (userRow.password_hash !== password.trim()) {
      res.status(401).json({ error: 'Mật khẩu không chính xác.' });
      return;
    }

    const userPayload = {
      id: String(userRow.id),
      username: String(userRow.username),
      fullName: String(userRow.full_name),
      role: String(userRow.role),
      branchId: String(userRow.branch_id),
    };

    const token = generateToken(userPayload);

    res.json({
      success: true,
      token,
      user: {
        id: userRow.id,
        username: userRow.username,
        fullName: userRow.full_name,
        role: userRow.role,
        branchId: userRow.branch_id,
        email: userRow.email,
        phone: userRow.phone,
        salaryBasic: userRow.salary_basic,
        status: userRow.status,
        avatarUrl: userRow.avatar_url,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi đăng nhập: ' + error.message });
  }
});

authRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Chưa đăng nhập.' });
      return;
    }

    const result = await db.execute({
      sql: 'SELECT id, username, full_name, role, branch_id, email, phone, salary_basic, status, avatar_url FROM users WHERE id = ?',
      args: [req.user.id],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Không tìm thấy thông tin người dùng.' });
      return;
    }

    const u = result.rows[0];
    res.json({
      id: u.id,
      username: u.username,
      fullName: u.full_name,
      role: u.role,
      branchId: u.branch_id,
      email: u.email,
      phone: u.phone,
      salaryBasic: u.salary_basic,
      status: u.status,
      avatarUrl: u.avatar_url,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi kiểm tra phiên đăng nhập: ' + error.message });
  }
});
