import { Router } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../auth';

export const usersRouter = Router();

// Lấy danh sách người dùng (chỉ Admin)
usersRouter.get('/', authenticateToken, requireRole(['admin']), async (_req, res) => {
  try {
    const result = await db.execute('SELECT id, username, full_name, role, branch_id, email, phone, salary_basic, status, avatar_url, created_at FROM users ORDER BY created_at ASC');
    const users = result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      role: row.role,
      branchId: row.branch_id,
      email: row.email,
      phone: row.phone,
      salaryBasic: row.salary_basic,
      status: row.status,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
    }));
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi truy vấn người dùng: ' + error.message });
  }
});

// Thêm người dùng mới (chỉ Admin)
usersRouter.post('/', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { username, password, fullName, role, branchId, email, phone, salaryBasic, status, avatarUrl } = req.body;

    if (!username || !fullName) {
      res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ tên đăng nhập và họ tên.' });
      return;
    }

    const check = await db.execute({
      sql: 'SELECT id FROM users WHERE LOWER(username) = LOWER(?)',
      args: [username.trim()],
    });

    if (check.rows.length > 0) {
      res.status(400).json({ error: `Tên đăng nhập "${username}" đã tồn tại trên hệ thống.` });
      return;
    }

    const newId = 'user-' + Date.now();
    const finalPassword = password ? String(password).trim() : 'password123';
    const finalRole = ['admin', 'store_manager', 'warehouse_manager', 'sales_staff'].includes(role) ? role : 'sales_staff';
    const finalBranchId = finalRole === 'admin' ? 'all' : (branchId || 'branch-hcm-01');

    await db.execute({
      sql: `INSERT INTO users (id, username, password_hash, full_name, role, branch_id, email, phone, salary_basic, status, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        newId,
        username.trim().toLowerCase(),
        finalPassword,
        fullName.trim(),
        finalRole,
        finalBranchId,
        email ? String(email).trim() : '',
        phone ? String(phone).trim() : '',
        Number(salaryBasic) || 0,
        status || 'active',
        avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      ],
    });

    res.status(201).json({
      success: true,
      message: `Đã thêm tài khoản "${fullName}" thành công.`,
      user: {
        id: newId,
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        role: finalRole,
        branchId: finalBranchId,
        email,
        phone,
        salaryBasic,
        status: status || 'active',
        avatarUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi tạo người dùng: ' + error.message });
  }
});

// Cập nhật người dùng (Admin có thể sửa mọi người dùng; Người dùng có thể sửa hồ sơ/avatar của chính mình)
usersRouter.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const isSelf = req.user?.id === id;
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin && !isSelf) {
      res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa hồ sơ người dùng khác.' });
      return;
    }

    const exist = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [id],
    });

    if (exist.rows.length === 0) {
      res.status(404).json({ error: 'Không tìm thấy người dùng cần cập nhật.' });
      return;
    }

    const currentUserRow = exist.rows[0];
    const { fullName, email, phone, avatarUrl, password, role, branchId, salaryBasic, status } = req.body;

    // Chỉ Admin mới được phép đổi Role, Status, BranchId, Salary
    const finalRole = isAdmin && role ? role : currentUserRow.role;
    const finalStatus = isAdmin && status ? status : currentUserRow.status;
    const finalBranchId = isAdmin && branchId ? branchId : currentUserRow.branch_id;
    const finalSalary = isAdmin && salaryBasic !== undefined ? Number(salaryBasic) : currentUserRow.salary_basic;
    const finalPassword = password ? String(password).trim() : currentUserRow.password_hash;
    const finalAvatar = avatarUrl || currentUserRow.avatar_url;
    const finalFullName = fullName ? String(fullName).trim() : currentUserRow.full_name;

    await db.execute({
      sql: `UPDATE users
            SET full_name = ?, email = ?, phone = ?, avatar_url = ?, password_hash = ?, role = ?, branch_id = ?, salary_basic = ?, status = ?
            WHERE id = ?`,
      args: [
        finalFullName,
        email !== undefined ? String(email).trim() : currentUserRow.email,
        phone !== undefined ? String(phone).trim() : currentUserRow.phone,
        finalAvatar,
        finalPassword,
        finalRole,
        finalBranchId,
        finalSalary,
        finalStatus,
        id,
      ],
    });

    res.json({
      success: true,
      message: `Đã cập nhật hồ sơ người dùng thành công.`,
      user: {
        id,
        username: currentUserRow.username,
        fullName: finalFullName,
        role: finalRole,
        branchId: finalBranchId,
        email,
        phone,
        salaryBasic: finalSalary,
        status: finalStatus,
        avatarUrl: finalAvatar,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi cập nhật người dùng: ' + error.message });
  }
});

// Xóa người dùng (chỉ Admin)
usersRouter.delete('/:id', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      res.status(400).json({ error: 'Bạn không thể tự xóa tài khoản Admin đang đăng nhập của chính mình.' });
      return;
    }

    const target = await db.execute({
      sql: 'SELECT role, full_name FROM users WHERE id = ?',
      args: [id],
    });

    if (target.rows.length === 0) {
      res.status(404).json({ error: 'Không tìm thấy người dùng cần xóa.' });
      return;
    }

    if (target.rows[0].role === 'admin') {
      const adminCount = await db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
      if (Number(adminCount.rows[0].count) <= 1) {
        res.status(400).json({ error: 'Không thể xóa tài khoản Quản Trị Viên (Admin) duy nhất còn lại.' });
        return;
      }
    }

    await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [id],
    });

    res.json({
      success: true,
      message: `Đã xóa tài khoản "${target.rows[0].full_name}" khỏi hệ thống.`,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi xóa người dùng: ' + error.message });
  }
});
