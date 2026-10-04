import React, { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Package,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  User,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INITIAL_USERS } from '../../data/usersData';
import { UserRole } from '../../types';

interface LoginViewProps {
  onSuccess?: () => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, isModal = false, onClose }) => {
  const { login } = useApp();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      setLoading(false);
      if (res.success) {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else {
        setErrorMessage(res.message || 'Đăng nhập không thành công.');
      }
    }, 200);
  };

  const handleQuickLogin = (uname: string, pwd: string) => {
    setUsername(uname);
    setPassword(pwd);
    setLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      const res = login(uname, pwd);
      setLoading(false);
      if (res.success) {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }
    }, 200);
  };

  const roleBadges: Record<UserRole, { color: string; label: string }> = {
    admin: { color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Admin Toàn Quyền' },
    store_manager: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Cửa Hàng Trưởng' },
    warehouse_manager: { color: 'bg-amber-50 text-amber-800 border-amber-200', label: 'Quản Lý Kho' },
    sales_staff: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Thu Ngân Bán Hàng' },
  };

  return (
    <div className={`flex items-center justify-center p-4 ${isModal ? '' : 'min-h-[90vh]'}`}>
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 max-w-xl w-full p-6 sm:p-8 space-y-6">
        
        {/* Brand & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-md mb-1">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">FreshMart</h2>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                RMS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Hệ thống Quản lý Bán lẻ Thực phẩm &amp; Chuỗi Cửa Hàng
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên đăng nhập (Username)</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập (vd: admin, thungan_01...)"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Đang xác thực...</span>
            ) : (
              <>
                <span>ĐĂNG NHẬP VÀO HỆ THỐNG</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Fast Demo Login for all 4 roles */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Hoặc bấm chọn nhanh tài khoản vai trò để trải nghiệm:</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {INITIAL_USERS.map((acc) => {
              const badge = roleBadges[acc.role];
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickLogin(acc.username, acc.passwordHash)}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group flex items-start gap-3 bg-white"
                >
                  <img
                    src={acc.avatarUrl}
                    alt={acc.fullName}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="grow min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 truncate">{acc.fullName}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      user: <strong>{acc.username}</strong>
                    </div>
                    <div className="mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {isModal && onClose && (
          <div className="text-center pt-1">
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Đóng cửa sổ
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
