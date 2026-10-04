import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  Package,
  QrCode,
  Smartphone,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateBatchSummary, isExpired, isExpiringSoon } from '../../services/fefoEngine';

export const ReportsModule: React.FC = () => {
  const { invoices, batches, products, branches, currentBranch, customers } = useApp();

  // Metrics for active branch
  const branchInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.branchId === currentBranch.id && inv.status === 'completed');
  }, [invoices, currentBranch]);

  const totalRevenue = useMemo(() => {
    return branchInvoices.reduce((acc, inv) => acc + inv.finalTotal, 0);
  }, [branchInvoices]);

  const totalCostOfSold = useMemo(() => {
    return branchInvoices.reduce((acc, inv) => {
      let invCost = 0;
      inv.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          invCost += prod.costPrice * item.quantity;
        }
      });
      return acc + invCost;
    }, 0);
  }, [branchInvoices, products]);

  const grossProfit = totalRevenue - totalCostOfSold;
  const avgOrderValue = branchInvoices.length > 0 ? Math.round(totalRevenue / branchInvoices.length) : 0;

  // Food Waste Risk: Batches in current branch that are expiring in < 7 days
  const wasteRiskMetrics = useMemo(() => {
    let riskCost = 0;
    let riskCount = 0;

    batches
      .filter((b) => b.branchId === currentBranch.id)
      .forEach((b) => {
        if (isExpiringSoon(b.expiryDate, 7) || isExpired(b.expiryDate)) {
          riskCost += b.quantity * b.costPrice;
          riskCount += b.quantity;
        }
      });

    return { riskCost, riskCount };
  }, [batches, currentBranch]);

  // Payment Breakdown
  const paymentStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      vietqr: { count: 0, total: 0 },
      momo: { count: 0, total: 0 },
      vnpay: { count: 0, total: 0 },
    };

    branchInvoices.forEach((inv) => {
      if (stats[inv.paymentMethod]) {
        stats[inv.paymentMethod].count += 1;
        stats[inv.paymentMethod].total += inv.finalTotal;
      }
    });

    return stats;
  }, [branchInvoices]);

  // Top Selling Items in branch
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; unitSize: string; quantity: number; revenue: number }> = {};

    branchInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = {
            name: item.productName,
            unitSize: item.unitSize,
            quantity: 0,
            revenue: 0,
          };
        }
        map[item.productId].quantity += item.quantity;
        map[item.productId].revenue += item.total;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [branchInvoices]);

  // Branch Comparison
  const branchComparison = useMemo(() => {
    return branches.map((b) => {
      const invs = invoices.filter((i) => i.branchId === b.id && i.status === 'completed');
      const rev = invs.reduce((acc, i) => acc + i.finalTotal, 0);
      const bBatches = batches.filter((bt) => bt.branchId === b.id);
      const stockTotal = bBatches.reduce((acc, bt) => acc + bt.quantity, 0);

      return {
        branch: b,
        orderCount: invs.length,
        revenue: rev,
        stockCount: stockTotal,
      };
    });
  }, [branches, invoices, batches]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Báo Cáo Doanh Thu &amp; Phân Tích Chuỗi Thực Phẩm
          </h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Chi nhánh: <strong>{currentBranch.name}</strong> · Cập nhật số liệu bán hàng và cảnh báo hao hụt thời gian thực
          </div>
        </div>

        <button
          onClick={() => alert('Xuất báo cáo định dạng Excel / PDF thành công!')}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất Báo Cáo Excel</span>
        </button>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Doanh số ca bán hàng</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {totalRevenue.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>Từ {branchInvoices.length} đơn hoàn tất</span>
          </div>
        </div>

        {/* Metric 2: Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Lợi nhuận gộp ước tính</div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums">
            {grossProfit.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Tỷ suất: {totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0}%
          </div>
        </div>

        {/* Metric 3: Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Giá trị đơn bình quân (AOV)</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {avgOrderValue.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[11px] text-slate-400">Trên mỗi lượt khách thu ngân</div>
        </div>

        {/* Metric 4: Food Waste Risk */}
        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
            <span>Nguy cơ hao hụt cận hạn</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900 font-mono tabular-nums">
            {wasteRiskMetrics.riskCost.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[11px] text-amber-700">
            {wasteRiskMetrics.riskCount} mặt hàng cận date &lt; 7 ngày cần đẩy bán
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Payment Methods & Top Products (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Payment Methods Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Cơ Cấu Hình Thức Thanh Toán</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              {/* Cash */}
              <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Tiền mặt</span>
                </div>
                <div className="font-mono font-extrabold text-slate-900 tabular-nums text-sm">
                  {paymentStats.cash.total.toLocaleString('vi-VN')} ₫
                </div>
                <div className="text-[10px] text-slate-500">{paymentStats.cash.count} giao dịch</div>
              </div>

              {/* VietQR */}
              <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-blue-800 font-bold">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>VietQR</span>
                </div>
                <div className="font-mono font-extrabold text-slate-900 tabular-nums text-sm">
                  {paymentStats.vietqr.total.toLocaleString('vi-VN')} ₫
                </div>
                <div className="text-[10px] text-slate-500">{paymentStats.vietqr.count} giao dịch</div>
              </div>

              {/* MoMo */}
              <div className="p-3 rounded-xl border border-pink-100 bg-pink-50/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-pink-800 font-bold">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Ví MoMo</span>
                </div>
                <div className="font-mono font-extrabold text-slate-900 tabular-nums text-sm">
                  {paymentStats.momo.total.toLocaleString('vi-VN')} ₫
                </div>
                <div className="text-[10px] text-slate-500">{paymentStats.momo.count} giao dịch</div>
              </div>

              {/* VNPAY */}
              <div className="p-3 rounded-xl border border-sky-100 bg-sky-50/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-sky-800 font-bold">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>VNPAY</span>
                </div>
                <div className="font-mono font-extrabold text-slate-900 tabular-nums text-sm">
                  {paymentStats.vnpay.total.toLocaleString('vi-VN')} ₫
                </div>
                <div className="text-[10px] text-slate-500">{paymentStats.vnpay.count} giao dịch</div>
              </div>

            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Top Sản Phẩm Thực Phẩm Bán Chạy Nhất</h3>

            {topProducts.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Chưa có dữ liệu giao dịch để thống kê top bán chạy.
              </div>
            ) : (
              <div className="space-y-2.5">
                {topProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.unitSize}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900 tabular-nums text-xs">
                        {p.revenue.toLocaleString('vi-VN')} ₫
                      </div>
                      <div className="text-[11px] text-emerald-600 font-medium font-mono">
                        {p.quantity} lượt bán
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right: Cross-Branch Performance Comparison (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900">So Sánh Hiệu Quả Giữa Các Chi Nhánh</h3>

            <div className="space-y-3">
              {branchComparison.map((item) => (
                <div
                  key={item.branch.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.branch.id === currentBranch.id
                      ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{item.branch.name}</div>
                      <div className="text-[11px] text-slate-500">{item.branch.address}</div>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {item.branch.code}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2.5 mt-2 border-t border-slate-200/60 text-center">
                    <div>
                      <div className="text-[10px] text-slate-500">Đơn hàng</div>
                      <div className="font-mono font-bold text-xs text-slate-900">{item.orderCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Doanh thu</div>
                      <div className="font-mono font-bold text-xs text-emerald-700">
                        {item.revenue > 0 ? (item.revenue / 1000).toFixed(0) + 'k' : '0 ₫'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Tồn kho</div>
                      <div className="font-mono font-bold text-xs text-slate-900">{item.stockCount} món</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer VIP info */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Khách hàng thân thiết &amp; Công nợ</span>
              </div>
              <div className="space-y-1.5">
                {customers.map((c) => (
                  <div key={c.id} className="text-[11px] flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-900">{c.name}</span>
                      <span className="text-slate-400 font-mono ml-1.5">({c.phone})</span>
                    </div>
                    <div className="font-mono">
                      {c.debtAmount > 0 ? (
                        <span className="text-rose-600 font-bold">Nợ: {c.debtAmount.toLocaleString('vi-VN')} ₫</span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">{c.loyaltyPoints} điểm tích lũy</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
