import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  KeyRound,
  LogOut,
  MapPin,
  Package,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
  Upload,
  User as UserIcon,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { USER_AVATAR_PRESETS } from '../data/usersData';
import { UserRole } from '../types';
import { LoginView } from './auth/LoginView';

export const ROLE_INFO: Record<UserRole, { label: string; desc: string; color: string }> = {
  admin: {
    label: 'Ban Quản Trị (Admin)',
    desc: 'Toàn quyền cấu hình chi nhánh, sản phẩm, phân quyền & báo cáo toàn chuỗi.',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  store_manager: {
    label: 'Cửa Hàng Trưởng (Store Manager)',
    desc: 'Quản lý doanh thu, ca bán hàng, duyệt hủy hóa đơn và nhân sự chi nhánh.',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  warehouse_manager: {
    label: 'Thủ Kho (Warehouse Manager)',
    desc: 'Quản lý lô hàng, nhập hàng, kiểm kê hạn sử dụng FEFO & điều chỉnh tồn kho.',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  sales_staff: {
    label: 'Thu Ngân (Sales Staff)',
    desc: 'Bán hàng POS nhanh, quét mã vạch, thanh toán và in hóa đơn khách hàng.',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

export const Header: React.FC = () => {
  const {
    currentUser,
    users,
    updateUser,
    logout,
    currentRole,
    setCurrentRole,
    currentBranch,
    setCurrentBranch,
    branches,
    isOffline,
    isOfflineSimulated,
    toggleOfflineSim,
    outbox,
    isSyncing,
    syncOutbox,
    activeTab,
    setActiveTab,
    resetDemoData,
  } = useApp();

  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [avatarToast, setAvatarToast] = useState('');
  const avatarFileRef = useRef<HTMLInputElement | null>(null);

  const handleOpenAvatarModal = () => {
    setUserMenuOpen(false);
    setNewAvatarUrl(currentUser?.avatarUrl || USER_AVATAR_PRESETS[0].url);
    setAvatarToast('');
    setAvatarModalOpen(true);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = () => {
    if (!currentUser) return;
    const targetUserAcc = users.find((u) => u.id === currentUser.id);
    const updatedAcc = targetUserAcc
      ? { ...targetUserAcc, avatarUrl: newAvatarUrl }
      : { ...currentUser, passwordHash: 'password123', avatarUrl: newAvatarUrl };

    updateUser(updatedAcc);
    setAvatarToast('Đã cập nhật ảnh đại diện thành công!');
    setTimeout(() => {
      setAvatarToast('');
      setAvatarModalOpen(false);
    }, 1200);
  };

  const pendingOutboxCount = outbox.filter((i) => i.status === 'pending').length;

  const navItems = [
    { id: 'pos', label: 'Bán Hàng POS', icon: ShoppingBag, allowedRoles: ['sales_staff', 'store_manager', 'admin'] },
    { id: 'products', label: 'Sản Phẩm', icon: Package, allowedRoles: ['sales_staff', 'store_manager', 'warehouse_manager', 'admin'] },
    { id: 'batches', label: 'Kho & Lô FEFO', icon: Tag, allowedRoles: ['warehouse_manager', 'store_manager', 'admin'] },
    { id: 'map_shelves', label: 'Bản Đồ & Kệ Hàng', icon: MapPin, allowedRoles: ['sales_staff', 'store_manager', 'warehouse_manager', 'admin'] },
    { id: 'invoices', label: 'Hóa Đơn', icon: FileText, allowedRoles: ['sales_staff', 'store_manager', 'admin'] },
    { id: 'reports', label: 'Báo Cáo', icon: TrendingUp, allowedRoles: ['store_manager', 'warehouse_manager', 'admin'] },
    { id: 'users', label: 'Quản Lý Người Dùng', icon: Users, allowedRoles: ['admin'] },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Offline Alert Strip if in Offline Mode */}
      {isOffline && (
        <div className="bg-amber-500 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
            <span>
              <strong>Chế độ Bán Hàng Ngoại Tuyến (Offline Mode):</strong> Dữ liệu hóa đơn sẽ được lưu vào Outbox và tự động đồng bộ khi có kết nối trở lại.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono tabular-nums font-semibold bg-amber-600/60 px-2 py-0.5 rounded">
              {pendingOutboxCount} giao dịch chờ đồng bộ
            </span>
            <button
              onClick={toggleOfflineSim}
              className="text-xs bg-white text-amber-900 font-semibold px-2.5 py-0.5 rounded hover:bg-amber-50 transition-colors"
            >
              Bật lại Mạng
            </button>
          </div>
        </div>
      )}

      {/* Main One-Row Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Zone 1: Brand & Current Branch */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('pos')}>
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs font-bold text-lg">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold tracking-tight text-slate-900">FreshMart</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">RMS</span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium hidden sm:block">
                  Quản lý chuỗi thực phẩm
                </div>
              </div>
            </div>

            {/* Branch Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setBranchMenuOpen(!branchMenuOpen);
                  setUserMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-medium text-slate-700"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-900 max-w-[130px] truncate">{currentBranch.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
              </button>

              {branchMenuOpen && (
                <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Chọn chi nhánh làm việc
                  </div>
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setCurrentBranch(b);
                        setBranchMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-start justify-between ${
                        b.id === currentBranch.id ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">{b.name}</div>
                        <div className="text-[11px] text-slate-600 line-clamp-1">{b.address}</div>
                      </div>
                      {b.id === currentBranch.id && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Zone 2: Navigation Links (Responsive) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isAllowed = item.allowedRoles.includes(currentRole);

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  disabled={!isAllowed}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : isAllowed
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-slate-400 opacity-40 cursor-not-allowed'
                  }`}
                  title={!isAllowed ? `Vai trò ${ROLE_INFO[currentRole].label} không có quyền truy cập` : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions & User Controls */}
          <div className="flex items-center gap-2">
            
            {/* Offline Simulation Toggle & Outbox Status */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleOfflineSim}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isOffline
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                }`}
                title="Bấm để chuyển đổi chế độ Giả lập Mất Mạng để kiểm tra bán hàng ngoại tuyến"
              >
                {isOffline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">Offline</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Online</span>
                  </>
                )}
              </button>

              {/* Sync trigger button if outbox has items */}
              {pendingOutboxCount > 0 && (
                <button
                  type="button"
                  onClick={syncOutbox}
                  disabled={isOffline || isSyncing}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
                  title="Đồng bộ hóa các đơn hàng trong Outbox lên máy chủ"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="font-mono tabular-nums">{pendingOutboxCount} Sync</span>
                </button>
              )}
            </div>

            {/* Fixed Role Badge attached to the authenticated account */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold select-none ${ROLE_INFO[currentRole].color}`}
              title={`Vai trò người dùng: ${ROLE_INFO[currentRole].desc}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{ROLE_INFO[currentRole].label.split('(')[0]}</span>
              <span className="md:hidden font-mono uppercase text-[10px]">{currentRole}</span>
            </div>

            {/* User Account / Profile Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setBranchMenuOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="text-left hidden xl:block pr-1">
                    <div className="text-xs font-bold text-slate-900 leading-none">{currentUser.fullName}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">@{currentUser.username}</div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
                    {/* User Card */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.fullName}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">{currentUser.fullName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                        <div className="text-[10px] font-mono text-emerald-700 font-semibold mt-0.5">
                          Vai trò: {ROLE_INFO[currentUser.role]?.label.split('(')[0]}
                        </div>
                      </div>
                    </div>

                    <div className="py-2 space-y-1 text-xs">
                      <button
                        type="button"
                        onClick={handleOpenAvatarModal}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-800 hover:bg-emerald-50 font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>Đổi ảnh đại diện (Avatar)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setLoginModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 transition-colors"
                      >
                        <KeyRound className="w-4 h-4 text-slate-400" />
                        <span>Đổi tài khoản đăng nhập</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu của cửa hàng?')) {
                            resetDemoData();
                            setUserMenuOpen(false);
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-2 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4 text-slate-400" />
                        <span>Khôi phục dữ liệu ban đầu</span>
                      </button>

                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Đăng xuất khỏi hệ thống</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLoginModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Đăng Nhập
              </button>
            )}

          </div>

        </div>

        {/* Mobile Navigation Row (under header) */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAllowed = item.allowedRoles.includes(currentRole);

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                disabled={!isAllowed}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : isAllowed
                    ? 'text-slate-600 bg-slate-50 hover:bg-slate-100'
                    : 'text-slate-300 opacity-40 cursor-not-allowed'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Switch Account Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative max-w-xl w-full">
            <LoginView isModal onClose={() => setLoginModalOpen(false)} />
          </div>
        </div>
      )}

      {/* Change Avatar / Profile Modal */}
      {avatarModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Đổi Ảnh Đại Diện (Avatar)</h3>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Tài khoản: <strong>{currentUser.fullName}</strong> (@{currentUser.username})
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAvatarModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {avatarToast && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{avatarToast}</span>
              </div>
            )}

            {/* Avatar Preview & Device Upload */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative group shrink-0">
                  <img
                    src={newAvatarUrl || currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md bg-white"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = USER_AVATAR_PRESETS[0].url;
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                    title="Bấm để tải ảnh mới"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1.5 grow">
                  <input
                    type="file"
                    ref={avatarFileRef}
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh từ máy / điện thoại</span>
                  </button>
                  <div className="text-[10px] text-slate-500 text-center">
                    Hỗ trợ file JPG, PNG, WebP (Tự động nén)
                  </div>
                </div>
              </div>

              {/* URL Input */}
              <div className="pt-1">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Hoặc dán URL liên kết ảnh:
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={newAvatarUrl}
                  onChange={(e) => setNewAvatarUrl(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>

            {/* Presets List */}
            <div>
              <div className="text-[11px] font-semibold text-slate-700 mb-1.5">
                Hoặc chọn nhanh từ danh mục mẫu ảnh:
              </div>
              <div className="grid grid-cols-6 gap-2">
                {USER_AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewAvatarUrl(preset.url)}
                    className={`h-11 rounded-xl overflow-hidden border relative transition-all group ${
                      newAvatarUrl === preset.url
                        ? 'ring-2 ring-emerald-500 border-emerald-500 scale-105 shadow-xs'
                        : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-400'
                    }`}
                    title={preset.label}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    {newAvatarUrl === preset.url && (
                      <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAvatarModalOpen(false)}
                className="px-4 py-2 font-semibold text-xs text-slate-600 hover:text-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu Ảnh Đại Diện</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
