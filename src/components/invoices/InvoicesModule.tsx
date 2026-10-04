import React, { useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Printer,
  RotateCcw,
  Search,
  WifiOff,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { ThermalReceiptModal } from '../pos/ThermalReceiptModal';

export const InvoicesModule: React.FC = () => {
  const { invoices, currentBranch, cancelInvoice, currentRole } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<Invoice | null>(null);
  const [cancelModalInvoice, setCancelModalInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('Khách đổi ý trả hàng nguyên seal');
  const [actionMessage, setActionMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Filter invoices for current branch
  const branchInvoices = invoices.filter((inv) => inv.branchId === currentBranch.id);

  const filteredInvoices = branchInvoices.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      inv.code.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.customerPhone.includes(q) ||
      inv.cashierName.toLowerCase().includes(q)
    );
  });

  const handleConfirmCancel = () => {
    if (!cancelModalInvoice) return;
    const res = cancelInvoice(cancelModalInvoice.id, cancelReason);
    setActionMessage({ text: res.message, error: !res.success });
    setCancelModalInvoice(null);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const canCancel = currentRole === 'admin' || currentRole === 'store_manager';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Lịch Sử Hóa Đơn &amp; Chứng Từ Bán Hàng
          </h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Chi nhánh: <strong>{currentBranch.name}</strong> · Tra cứu hóa đơn, in lại bill nhiệt 80mm hoặc hủy đơn hoàn trả tồn kho
          </div>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs ${
            actionMessage.error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo số HĐ, tên khách, SĐT, thu ngân..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Tổng cộng: <strong>{filteredInvoices.length}</strong> hóa đơn
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">SỐ HÓA ĐƠN</th>
                <th className="py-3 px-4">THỜI GIAN</th>
                <th className="py-3 px-4">KHÁCH HÀNG</th>
                <th className="py-3 px-4">THU NGÂN</th>
                <th className="py-3 px-4">HÌNH THỨC TT</th>
                <th className="py-3 px-4 text-right">TỔNG TIỀN</th>
                <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                <th className="py-3 px-4 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Chưa có hóa đơn nào được tạo tại chi nhánh này.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const dateStr = new Date(inv.createdAt).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                  });

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        inv.status === 'cancelled' ? 'bg-slate-50/60 opacity-60' : ''
                      }`}
                    >
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{inv.code}</span>
                          {inv.isOfflineSync && (
                            <span
                              className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-sans font-bold flex items-center gap-0.5"
                              title="Hóa đơn tạo trong chế độ Offline"
                            >
                              <WifiOff className="w-2.5 h-2.5" />
                              <span>Offline</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Time */}
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{dateStr}</td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{inv.customerName}</div>
                        {inv.customerPhone && (
                          <div className="text-[11px] text-slate-500 font-mono">{inv.customerPhone}</div>
                        )}
                      </td>

                      {/* Cashier */}
                      <td className="py-3 px-4 text-slate-600">{inv.cashierName}</td>

                      {/* Payment Method */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                          {inv.paymentMethod === 'cash'
                            ? 'Tiền mặt'
                            : inv.paymentMethod === 'vietqr'
                            ? 'VietQR'
                            : inv.paymentMethod === 'momo'
                            ? 'Ví MoMo'
                            : 'VNPAY'}
                        </span>
                      </td>

                      {/* Final Total */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums text-sm">
                        {inv.finalTotal.toLocaleString('vi-VN')} ₫
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {inv.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đã thu tiền</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <Ban className="w-3 h-3" />
                            <span>Đã hủy</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForReceipt(inv)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Xem và in lại bill 80mm"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {inv.status === 'completed' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!canCancel) {
                                  alert('Chỉ Cửa hàng trưởng hoặc Admin mới có quyền hủy hóa đơn hoàn kho.');
                                  return;
                                }
                                setCancelModalInvoice(inv);
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                canCancel
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-200 cursor-not-allowed'
                              }`}
                              title={canCancel ? 'Hủy hóa đơn hoàn kho' : 'Không đủ quyền hạn'}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Modal Cancel Invoice Confirmation */}
      {cancelModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Xác Nhận Hủy Hóa Đơn</span>
              </div>
              <button onClick={() => setCancelModalInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 space-y-3 text-xs">
              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 text-rose-800">
                <div>
                  Bạn chuẩn bị hủy hóa đơn <strong>{cancelModalInvoice.code}</strong> (Trị giá:{' '}
                  <strong>{cancelModalInvoice.finalTotal.toLocaleString('vi-VN')} ₫</strong>).
                </div>
                <div className="text-[11px] mt-1 font-semibold text-rose-700">
                  Toàn bộ các mặt hàng trong đơn sẽ được tự động hoàn trả lại tồn kho theo đúng lô FEFO ban đầu.
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do hủy hóa đơn</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Khách đổi ý trả hàng nguyên seal">Khách đổi ý trả hàng nguyên seal</option>
                  <option value="Nhân viên thu ngân tính nhầm số lượng">Nhân viên thu ngân tính nhầm số lượng</option>
                  <option value="Lỗi thanh toán ngân hàng chuyển thừa/thiếu">Lỗi thanh toán ngân hàng chuyển thừa/thiếu</option>
                  <option value="Bao bì thực phẩm rách/móp khi thanh toán">Bao bì thực phẩm rách/móp khi thanh toán</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalInvoice(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Hủy &amp; Hoàn Kho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 80mm Thermal Receipt Preview Modal */}
      <ThermalReceiptModal
        invoice={selectedInvoiceForReceipt}
        onClose={() => setSelectedInvoiceForReceipt(null)}
      />

    </div>
  );
};
