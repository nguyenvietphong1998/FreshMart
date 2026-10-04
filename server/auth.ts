import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'freshmart-super-secret-jwt-key-2026';

export interface AuthUserPayload {
  id: string;
  username: string;
  fullName: string;
  role: string;
  branchId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
  } catch (_e) {
    return null;
  }
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Chưa đăng nhập hoặc thiếu Bearer Token.' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(403).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
    return;
  }

  req.user = decoded;
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Chưa xác thực người dùng.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Truy cập bị từ chối (403 Forbidden). Vai trò "${req.user.role}" không có quyền thực hiện hành động này. Yêu cầu một trong: [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
}
