import React from 'react';
import { CheckCircle2, Download, Printer, Share2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';

interface ThermalReceiptModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ invoice, onClose }) => {
  const { currentBranch } = useApp();

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(invoice.createdAt).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Modal Toolbar (hidden in print) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Thanh toán thành công!</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Phiếu 80mm</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 80mm Thermal Receipt Content (Visible on screen and printed directly) */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex justify-center">
          <div
            id="thermal-receipt-print-area"
            className="w-[80mm] max-w-full bg-white p-4 shadow-sm border border-slate-200 font-mono text-xs text-slate-900 space-y-3"
          >
            {/* Store Brand Header */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
              <div className="text-base font-extrabold uppercase tracking-wider">FRESHMART VIETNAM</div>
              <div className="text-[11px] font-semibold">{currentBranch.name}</div>
              <div className="text-[10px] text-slate-600 leading-tight">{currentBranch.address}</div>
              <div className="text-[10px] text-slate-600">Hotline: {currentBranch.phone}</div>
            </div>

            {/* Receipt Meta */}
            <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Số HĐ:</span>
                <span className="font-bold">{invoice.code}</span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Thu ngân:</span>
                <span>{invoice.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <span>{invoice.customerName}</span>
              </div>
              {invoice.isOfflineSync && (
                <div className="text-center font-bold text-amber-700 bg-amber-50 py-0.5 mt-1 border border-amber-200 rounded text-[9px]">
                  [ĐƠN BÁN OFFLINE - ĐÃ GHI NHẬN KHO]
                </div>
              )}
            </div>

            {/* Itemized List */}
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
              <div className="text-[10px] font-bold grid grid-cols-12 gap-1 border-b border-slate-200 pb-1">
                <span className="col-span-6">TÊN MÓN</span>
                <span className="col-span-2 text-right">SL</span>
                <span className="col-span-4 text-right">T.TIỀN</span>
              </div>

              {invoice.items.map((item, idx) => (
                <div key={idx} className="text-[11px] space-y-0.5">
                  <div className="font-medium leading-tight">{item.productName}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-600">
                    <span>
                      {item.unitSize} · {item.unitPrice.toLocaleString('vi-VN')}₫
                    </span>
                    <span className="font-bold text-slate-900">{item.total.toLocaleString('vi-VN')}₫</span>
                  </div>
                  {/* FEFO Lot Breakdown */}
                  <div className="text-[9px] text-slate-500 italic">
                    Lô: {item.batches.map((b) => `${b.batchCode} (${b.quantity})`).join(', ')}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Tiền hàng:</span>
                <span className="tabular-nums">{invoice.subtotal.toLocaleString('vi-VN')} ₫</span>
              </div>
              {invoice.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Khuyến mãi ({invoice.appliedPromotionCode}):</span>
                  <span className="tabular-nums">-{invoice.discountTotal.toLocaleString('vi-VN')} ₫</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-slate-200">
                <span>TỔNG CỘNG:</span>
                <span className="tabular-nums">{invoice.finalTotal.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                <span>Hình thức TT:</span>
                <span className="font-bold uppercase">
                  {invoice.paymentMethod === 'cash'
                    ? 'Tiền mặt'
                    : invoice.paymentMethod === 'vietqr'
                    ? 'VietQR 24/7'
                    : invoice.paymentMethod === 'momo'
                    ? 'Ví MoMo'
                    : 'VNPAY-QR'}
                </span>
              </div>
              {invoice.cashGiven !== undefined && (
                <>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Khách đưa:</span>
                    <span>{invoice.cashGiven.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Tiền thối lại:</span>
                    <span>{(invoice.changeReturn || 0).toLocaleString('vi-VN')} ₫</span>
                  </div>
                </>
              )}
            </div>

            {/* Barcode & Footer */}
            <div className="text-center space-y-2 pt-1">
              {/* SVG Barcode EAN-13 Representation */}
              <div className="flex justify-center py-1">
                <svg className="h-10 w-44" viewBox="0 0 100 25" preserveAspectRatio="none">
                  <g fill="#000">
                    <rect x="0" y="0" width="2" height="25" />
                    <rect x="3" y="0" width="1" height="25" />
                    <rect x="6" y="0" width="2" height="25" />
                    <rect x="10" y="0" width="1" height="22" />
                    <rect x="13" y="0" width="3" height="22" />
                    <rect x="18" y="0" width="1" height="22" />
                    <rect x="21" y="0" width="2" height="22" />
                    <rect x="25" y="0" width="3" height="22" />
                    <rect x="30" y="0" width="1" height="22" />
                    <rect x="33" y="0" width="2" height="22" />
                    <rect x="37" y="0" width="1" height="22" />
                    <rect x="40" y="0" width="3" height="22" />
                    <rect x="45" y="0" width="2" height="22" />
                    <rect x="48" y="0" width="1" height="25" />
                    <rect x="51" y="0" width="2" height="25" />
                    <rect x="55" y="0" width="3" height="22" />
                    <rect x="60" y="0" width="1" height="22" />
                    <rect x="63" y="0" width="2" height="22" />
                    <rect x="67" y="0" width="2" height="22" />
                    <rect x="71" y="0" width="1" height="22" />
                    <rect x="74" y="0" width="3" height="22" />
                    <rect x="79" y="0" width="1" height="22" />
                    <rect x="82" y="0" width="2" height="22" />
                    <rect x="86" y="0" width="2" height="22" />
                    <rect x="90" y="0" width="1" height="22" />
                    <rect x="94" y="0" width="2" height="25" />
                    <rect x="98" y="0" width="2" height="25" />
                  </g>
                </svg>
              </div>
              <div className="text-[10px] tracking-widest">{invoice.code}</div>
              <div className="text-[10px] text-slate-500 font-sans italic pt-1">
                Cảm ơn quý khách và hẹn gặp lại!
                <br />
                Đổi trả trong 24h đối với thực phẩm tươi sống có kèm hóa đơn.
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tạo đơn mới
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>In Hóa Đơn</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
