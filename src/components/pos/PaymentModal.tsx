import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Banknote,
  CheckCircle,
  CreditCard,
  QrCode,
  Smartphone,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Invoice, PaymentMethod } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (invoice: Invoice) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const {
    cartFinalTotal,
    cartSubtotal,
    cartDiscount,
    checkout,
    currentBranch,
    customers,
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('Khách vãng lai');
  const [cashGiven, setCashGiven] = useState<number>(cartFinalTotal);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCustomerPhoneChange = (phone: string) => {
    setCustomerPhone(phone);
    const found = customers.find((c) => c.phone.includes(phone.trim()));
    if (found) {
      setCustomerName(found.name);
    }
  };

  const handleQuickCash = (amount: number) => {
    setCashGiven(amount);
  };

  const handleConfirmPayment = async () => {
    setErrorMsg('');
    if (paymentMethod === 'cash' && cashGiven < cartFinalTotal) {
      setErrorMsg('Số tiền khách đưa chưa đủ để thanh toán đơn hàng.');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await checkout(paymentMethod, {
        customerName,
        customerPhone,
        cashGiven: paymentMethod === 'cash' ? cashGiven : undefined,
        paymentRef:
          paymentMethod === 'vietqr'
            ? 'VQR-' + Math.floor(100000 + Math.random() * 900000)
            : paymentMethod === 'momo'
            ? 'MOMO-' + Date.now().toString().slice(-6)
            : paymentMethod === 'vnpay'
            ? 'VNPAY-' + Date.now().toString().slice(-6)
            : undefined,
      });

      if (result.success && result.invoice) {
        // Fire confetti celebration
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
        onSuccess(result.invoice);
      } else {
        setErrorMsg(result.error || 'Thanh toán thất bại.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const changeReturn = Math.max(0, cashGiven - cartFinalTotal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">Thanh Toán Đơn Hàng</h3>
            <div className="text-xs text-slate-500 font-medium">Chi nhánh: {currentBranch.name}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Khách cần thanh toán:</div>
              {cartDiscount > 0 && (
                <div className="text-[11px] text-emerald-600 font-medium">
                  Đã giảm: -{cartDiscount.toLocaleString('vi-VN')} ₫
                </div>
              )}
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums">
              {cartFinalTotal.toLocaleString('vi-VN')} ₫
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Chọn phương thức thanh toán
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              
              {/* 1. Cash */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${paymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Tiền Mặt</div>
                  <div className="text-[11px] text-slate-500">Thu ngân nhận trực tiếp</div>
                </div>
              </button>

              {/* 2. VietQR Transfer */}
              <button
                type="button"
                onClick={() => setPaymentMethod('vietqr')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === 'vietqr'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${paymentMethod === 'vietqr' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">VietQR Ngân Hàng</div>
                  <div className="text-[11px] text-slate-500">Quét mã chuyển khoản 247</div>
                </div>
              </button>

              {/* 3. MoMo QR */}
              <button
                type="button"
                onClick={() => setPaymentMethod('momo')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === 'momo'
                    ? 'border-pink-600 bg-pink-50/50 text-pink-900 ring-2 ring-pink-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${paymentMethod === 'momo' ? 'bg-[#A50064] text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Ví Điện Tử MoMo</div>
                  <div className="text-[11px] text-slate-500">Cổng thanh toán MoMo QR</div>
                </div>
              </button>

              {/* 4. VNPAY QR */}
              <button
                type="button"
                onClick={() => setPaymentMethod('vnpay')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === 'vnpay'
                    ? 'border-red-600 bg-red-50/50 text-red-900 ring-2 ring-red-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${paymentMethod === 'vnpay' ? 'bg-[#005BAA] text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">VNPAY-QR</div>
                  <div className="text-[11px] text-slate-500">Cổng thanh toán quốc gia</div>
                </div>
              </button>

            </div>
          </div>

          {/* Payment Method Details */}
          {paymentMethod === 'cash' && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiền khách đưa (₫)
                </label>
                <input
                  type="number"
                  value={cashGiven || ''}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickCash(cartFinalTotal)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                >
                  Đủ tiền
                </button>
                {[50000, 100000, 200000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickCash(amt)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                  >
                    {amt.toLocaleString('vi-VN')} ₫
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="text-slate-600 font-medium">Tiền thối lại khách:</span>
                <span className="font-mono font-extrabold text-base text-slate-900 tabular-nums">
                  {changeReturn.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'vietqr' && (
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 text-center space-y-3">
              <div className="inline-block p-2 bg-white rounded-xl shadow-xs border border-blue-100">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=2|99|0908123456|FRESHMART%20PAYMENT|${cartFinalTotal}`}
                  alt="VietQR Code"
                  className="w-40 h-40 mx-auto"
                />
              </div>
              <div className="text-xs text-blue-900 font-medium">
                <div>Ngân hàng Quân Đội (MBBank) · STK: <strong>0908123456789</strong></div>
                <div>Chủ TK: <strong>CONG TY CO PHAN FRESHMART VIET NAM</strong></div>
                <div className="text-[11px] text-blue-700 mt-1 font-mono">
                  Nội dung: <strong>FRESHMART {currentBranch.code}</strong>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle className="w-4 h-4" />
                <span>Hệ thống tự động ghi nhận khi tài khoản nhận được tiền</span>
              </div>
            </div>
          )}

          {paymentMethod === 'momo' && (
            <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/40 text-center space-y-3">
              <div className="inline-block p-2 bg-white rounded-xl shadow-xs border border-pink-100">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=momo://pay?amount=${cartFinalTotal}%26merchant=FRESHMART`}
                  alt="MoMo QR Code"
                  className="w-40 h-40 mx-auto"
                />
              </div>
              <div className="text-xs text-pink-900 font-medium">
                Mở ứng dụng <strong>MoMo</strong> và quét mã thanh toán <strong>{cartFinalTotal.toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div className="text-[11px] text-slate-500">Mã giao dịch MoMo: MOMO-{Date.now().toString().slice(-6)}</div>
            </div>
          )}

          {paymentMethod === 'vnpay' && (
            <div className="p-4 rounded-xl border border-blue-200 bg-sky-50/40 text-center space-y-3">
              <div className="inline-block p-2 bg-white rounded-xl shadow-xs border border-sky-100">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=vnpay://qr?amount=${cartFinalTotal}%26merchant=FRESHMART`}
                  alt="VNPAY QR Code"
                  className="w-40 h-40 mx-auto"
                />
              </div>
              <div className="text-xs text-sky-900 font-medium">
                Quét bằng ứng dụng ngân hàng bất kỳ qua cổng <strong>VNPAY-QR</strong>
              </div>
              <div className="text-[11px] text-slate-500">Mã hóa đơn VNPAY: VNP-{Date.now().toString().slice(-6)}</div>
            </div>
          )}

          {/* Customer Lookup (Optional) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Thông tin khách hàng (Tích điểm / Công nợ)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="SĐT khách hàng..."
                  value={customerPhone}
                  onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tên khách hàng..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {errorMsg}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Hủy thao tác
          </button>

          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <span>Đang ghi nhận hóa đơn...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Hoàn tất & In Hóa Đơn</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
