import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  DollarSign,
  Edit2,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { USER_AVATAR_PRESETS, UserAccount } from '../../data/usersData';
import { UserRole } from '../../types';
import { ROLE_INFO } from '../Header';

export const UsersModule: React.FC = () => {
  const { users, currentUser, currentRole, branches, addUser, updateUser, deleteUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('sales_staff');
  const [formBranchId, setFormBranchId] = useState<string>('branch-hcm-01');
  const [formSalary, setFormSalary] = useState<number>(10000000);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formAvatarUrl, setFormAvatarUrl] = useState<string>(USER_AVATAR_PRESETS[0].url);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh hợp lệ (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error: boolean } | null>(null);

  // STRICT ACCESS CONTROL GATE: Only Admin can access
  if (currentRole !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-900">Truy Cập Bị Từ Chối (403 Forbidden)</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Phân hệ Quản Lý Người Dùng &amp; Nhân Sự được bảo vệ nghiêm ngặt và <strong>chỉ dành riêng cho Ban Quản Trị (Admin)</strong>.
            Tài khoản hiện tại của bạn không có đặc quyền truy cập trang này.
          </p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterBranch !== 'all' && u.branchId !== filterBranch) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormFullName('');
    setFormUsername('');
    setFormPassword('password123');
    setFormEmail('');
    setFormPhone('');
    setFormRole('sales_staff');
    setFormBranchId(branches[0]?.id || 'all');
    setFormSalary(9000000);
    setFormStatus('active');
    setFormAvatarUrl(USER_AVATAR_PRESETS[Math.floor(Math.random() * USER_AVATAR_PRESETS.length)].url);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setFormFullName(user.fullName);
    setFormUsername(user.username);
    setFormPassword(user.passwordHash || 'password123');
    setFormEmail(user.email);
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormBranchId(user.branchId);
    setFormSalary(user.salaryBasic || 10000000);
    setFormStatus(user.status || 'active');
    setFormAvatarUrl(user.avatarUrl);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() || !formUsername.trim()) return;

    if (editingUser) {
      const res = updateUser({
        ...editingUser,
        fullName: formFullName.trim(),
        username: formUsername.trim().toLowerCase(),
        passwordHash: formPassword.trim() || editingUser.passwordHash,
        email: formEmail.trim(),
        phone: formPhone.trim(),
        role: formRole,
        branchId: formRole === 'admin' ? 'all' : formBranchId,
        salaryBasic: Number(formSalary),
        status: formStatus,
        avatarUrl: formAvatarUrl,
      });
      setFeedbackMsg({ text: res.message || '', error: !res.success });
      if (res.success) setIsModalOpen(false);
    } else {
      const res = addUser({
        fullName: formFullName.trim(),
        username: formUsername.trim().toLowerCase(),
        passwordHash: formPassword.trim() || 'password123',
        email: formEmail.trim(),
        phone: formPhone.trim(),
        role: formRole,
        branchId: formRole === 'admin' ? 'all' : formBranchId,
        salaryBasic: Number(formSalary),
        status: formStatus,
        avatarUrl: formAvatarUrl,
      });
      setFeedbackMsg({ text: res.message || '', error: !res.success });
      if (res.success) setIsModalOpen(false);
    }

    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản người dùng này khỏi hệ thống?')) {
      const res = deleteUser(userId);
      setFeedbackMsg({ text: res.message || '', error: !res.success });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Quản Lý Nhân Sự &amp; Người Dùng Hệ Thống
            </h2>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chỉ Ban Quản Trị</span>
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Cấp quyền tài khoản, phân bổ chi nhánh công tác, điều chỉnh lương cơ bản và kích hoạt/khóa tài khoản
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Người Dùng Mới</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs ${
            feedbackMsg.error
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Table Container */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, username, email, số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Role Filter */}
          <div className="md:col-span-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả vai trò ({users.length})</option>
              <option value="admin">Ban Quản Trị (Admin)</option>
              <option value="store_manager">Cửa Hàng Trưởng</option>
              <option value="warehouse_manager">Thủ Kho</option>
              <option value="sales_staff">Thu Ngân Bán Hàng</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div className="md:col-span-4">
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Users Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">NGƯỜI DÙNG &amp; TÀI KHOẢN</th>
                <th className="py-3 px-4">VAI TRÒ (RBAC)</th>
                <th className="py-3 px-4">CHI NHÁNH LÀM VIỆC</th>
                <th className="py-3 px-4">LIÊN HỆ</th>
                <th className="py-3 px-4 text-right">LƯƠNG CƠ BẢN</th>
                <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                <th className="py-3 px-4 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const branchObj = branches.find((b) => b.id === u.branchId);
                  const isCurrent = currentUser?.id === u.id;
                  const roleBadge = ROLE_INFO[u.role];

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl}
                            alt={u.fullName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {isCurrent && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-mono font-semibold">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${roleBadge.color}`}>
                          <Shield className="w-3 h-3" />
                          <span>{roleBadge.label.split('(')[0]}</span>
                        </span>
                      </td>

                      {/* Branch */}
                      <td className="py-3 px-4">
                        {u.role === 'admin' || u.branchId === 'all' ? (
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                            Toàn Hệ Thống
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="font-medium text-slate-900">{branchObj?.name || u.branchId}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{branchObj?.code}</div>
                          </div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{u.email || 'Chưa cập nhật'}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Basic Salary */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {u.salaryBasic ? u.salaryBasic.toLocaleString('vi-VN') + ' ₫' : 'Thỏa thuận'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <UserCheck className="w-3 h-3" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <UserX className="w-3 h-3" />
                            <span>Đã khóa</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Chỉnh sửa người dùng"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(u.id)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={isCurrent ? 'Không thể xóa chính tài khoản đang đăng nhập' : 'Xóa tài khoản'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser ? 'Cập Nhật Hồ Sơ Người Dùng' : 'Thêm Nhân Sự / Người Dùng Mới'}
                  </h3>
                  <div className="text-[11px] text-slate-500">Phân quyền vai trò và chi nhánh làm việc</div>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
              
              {/* Avatar Selector */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    Ảnh đại diện người dùng (Avatar)
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Tải tệp từ máy hoặc chọn ảnh mẫu
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Live Avatar Preview */}
                  <div className="relative group shrink-0">
                    <img
                      src={formAvatarUrl || USER_AVATAR_PRESETS[0].url}
                      alt="Avatar"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm bg-white"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = USER_AVATAR_PRESETS[0].url;
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                      title="Bấm để tải ảnh mới từ máy"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Upload from device and URL options */}
                  <div className="space-y-1.5 grow w-full">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải ảnh từ máy / điện thoại</span>
                      </button>

                      {formAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setFormAvatarUrl(USER_AVATAR_PRESETS[0].url)}
                          className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 font-medium"
                        >
                          Đặt lại mặc định
                        </button>
                      )}
                    </div>

                    <div>
                      <input
                        type="url"
                        placeholder="Hoặc dán URL liên kết hình ảnh avatar tại đây..."
                        value={formAvatarUrl}
                        onChange={(e) => setFormAvatarUrl(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Avatar Grid */}
                <div>
                  <div className="text-[10px] text-slate-500 font-medium mb-1.5">
                    Hoặc chọn nhanh từ danh mục ảnh mẫu:
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                    {USER_AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormAvatarUrl(preset.url)}
                        className={`h-9 w-9 rounded-xl overflow-hidden border relative transition-all ${
                          formAvatarUrl === preset.url
                            ? 'ring-2 ring-emerald-500 border-emerald-500 scale-105 shadow-xs'
                            : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400'
                        }`}
                        title={preset.label}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        {formAvatarUrl === preset.url && (
                          <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                
                {/* Full name */}
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Họ và tên nhân viên</label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn An"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên đăng nhập (Username)</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="vd: thungan_02"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mật khẩu đăng nhập</label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Mật khẩu..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vai trò người dùng (Role)</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="sales_staff">Thu Ngân Bán Hàng (Sales Staff)</option>
                    <option value="warehouse_manager">Thủ Kho (Warehouse Manager)</option>
                    <option value="store_manager">Cửa Hàng Trưởng (Store Manager)</option>
                    <option value="admin">Ban Quản Trị (Admin)</option>
                  </select>
                </div>

                {/* Branch */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chi nhánh phân công</label>
                  <select
                    value={formRole === 'admin' ? 'all' : formBranchId}
                    disabled={formRole === 'admin'}
                    onChange={(e) => setFormBranchId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {formRole === 'admin' ? (
                      <option value="all">Toàn bộ chi nhánh hệ thống</option>
                    ) : (
                      branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Địa chỉ Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@freshmart.vn"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="09xx xxx xxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Basic Salary */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lương cơ bản (₫)</label>
                  <input
                    type="number"
                    step="500000"
                    value={formSalary}
                    onChange={(e) => setFormSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái tài khoản</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="active">Hoạt động bình thường</option>
                    <option value="inactive">Đã khóa tài khoản</option>
                  </select>
                </div>

              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {editingUser ? 'Lưu Thay Đổi' : 'Thêm Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
