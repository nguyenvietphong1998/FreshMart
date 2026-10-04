import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  PackagePlus,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Sliders,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getDaysUntilExpiry, isExpired, isExpiringSoon, SIMULATED_TODAY } from '../../services/fefoEngine';
import { StockBatch } from '../../types';

export const InventoryBatchesModule: React.FC = () => {
  const {
    batches,
    products,
    currentBranch,
    addNewBatch,
    adjustBatchQuantity,
    currentRole,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | 'expiring_soon' | 'expired' | 'safe'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustBatchModal, setAdjustBatchModal] = useState<StockBatch | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Kiểm kê định kỳ phát hiện thừa/thiếu');

  // Form state for New Batch Intake (Phiếu Nhập Hàng)
  const [newBatchProductId, setNewBatchProductId] = useState(products[0]?.id || '');
  const [newBatchQuantity, setNewBatchQuantity] = useState<number>(20);
  const [newBatchCostPrice, setNewBatchCostPrice] = useState<number>(15000);
  const [newBatchExpiryDays, setNewBatchExpiryDays] = useState<number>(10);
  const [newBatchCode, setNewBatchCode] = useState<string>(
    'LOT-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-NEW'
  );

  // Filter batches by current branch
  const branchBatches = useMemo(() => {
    return batches.filter((b) => b.branchId === currentBranch.id);
  }, [batches, currentBranch]);

  // Enriched batch data with product details & expiry days
  const enrichedBatches = useMemo(() => {
    return branchBatches.map((batch) => {
      const prod = products.find((p) => p.id === batch.productId);
      const daysLeft = getDaysUntilExpiry(batch.expiryDate);
      const expired = isExpired(batch.expiryDate);
      const expiringSoon = isExpiringSoon(batch.expiryDate, 7);

      return {
        ...batch,
        product: prod,
        daysLeft,
        isExpired: expired,
        isExpiringSoon: expiringSoon,
      };
    });
  }, [branchBatches, products]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalQty = 0;
    let totalCostValue = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    enrichedBatches.forEach((b) => {
      totalQty += b.quantity;
      totalCostValue += b.quantity * b.costPrice;
      if (b.isExpired) expiredCount += b.quantity;
      else if (b.isExpiringSoon) expiringSoonCount += b.quantity;
    });

    return { totalQty, totalCostValue, expiringSoonCount, expiredCount };
  }, [enrichedBatches]);

  // Filtered List
  const filteredBatches = useMemo(() => {
    return enrichedBatches
      .filter((b) => {
        if (filterStatus === 'expiring_soon') return b.isExpiringSoon && !b.isExpired;
        if (filterStatus === 'expired') return b.isExpired;
        if (filterStatus === 'safe') return !b.isExpired && !b.isExpiringSoon;
        return true;
      })
      .filter((b) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          b.batchCode.toLowerCase().includes(q) ||
          b.product?.name.toLowerCase().includes(q) ||
          b.product?.barcode.includes(q)
        );
      })
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()); // FEFO sort
  }, [enrichedBatches, filterStatus, searchQuery]);

  const handleCreateNewBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchProductId || newBatchQuantity <= 0) return;

    const expiryDate = new Date(SIMULATED_TODAY);
    expiryDate.setDate(expiryDate.getDate() + Number(newBatchExpiryDays));

    addNewBatch({
      productId: newBatchProductId,
      branchId: currentBranch.id,
      batchCode: newBatchCode.trim() || 'LOT-' + Date.now().toString().slice(-6),
      quantity: Number(newBatchQuantity),
      costPrice: Number(newBatchCostPrice),
      expiryDate: expiryDate.toISOString().split('T')[0],
      receivedAt: SIMULATED_TODAY.toISOString().split('T')[0],
    });

    setIsAddModalOpen(false);
  };

  const handleConfirmAdjust = () => {
    if (!adjustBatchModal) return;
    adjustBatchQuantity(adjustBatchModal.id, adjustQuantity, adjustReason);
    setAdjustBatchModal(null);
  };

  const handleDisposeExpired = (batch: StockBatch) => {
    if (window.confirm(`Xác nhận lập biên bản tiêu hủy lô hàng quá hạn ${batch.batchCode}?`)) {
      adjustBatchQuantity(batch.id, 0, 'Tiêu hủy hàng quá hạn sử dụng theo quy chuẩn an toàn thực phẩm');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Intake Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Quản Lý Tồn Kho & Lô Hàng FEFO
          </h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Cửa hàng: <strong>{currentBranch.name}</strong> · Tự động cảnh báo hạn dùng và ưu tiên xuất lô cận hạn trước
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Nhập Phiếu Hàng Mới</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Batches */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Tổng lượng hàng tồn kho</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {metrics.totalQty.toLocaleString('vi-VN')} <span className="text-xs text-slate-500 font-normal">món</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Trải đều trên {branchBatches.length} lô hàng
          </div>
        </div>

        {/* Card 2: Total Cost Valuation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Tổng giá trị vốn trong kho</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {metrics.totalCostValue.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[11px] text-slate-400">Theo giá nhập lô hàng thực tế</div>
        </div>

        {/* Card 3: Expiring Soon Alert (< 7 days) */}
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
            <span>Cận hạn (&lt; 7 ngày)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900 font-mono tabular-nums">
            {metrics.expiringSoonCount} <span className="text-xs font-normal">món</span>
          </div>
          <div className="text-[11px] text-amber-700">Cần áp khuyến mãi hoặc đẩy ra quầy FEFO</div>
        </div>

        {/* Card 4: Expired Alert */}
        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-rose-800 font-semibold">
            <span>Đã Quá Hạn (Cấm bán)</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-900 font-mono tabular-nums">
            {metrics.expiredCount} <span className="text-xs font-normal">món</span>
          </div>
          <div className="text-[11px] text-rose-700">Đã khóa khỏi POS, cần lập biên bản hủy</div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tất Cả Lô ({enrichedBatches.length})
            </button>
            <button
              onClick={() => setFilterStatus('expiring_soon')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                filterStatus === 'expiring_soon'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Cận Hạn &lt; 7 Ngày</span>
            </button>
            <button
              onClick={() => setFilterStatus('expired')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                filterStatus === 'expired'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Quá Hạn ({metrics.expiredCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus('safe')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                filterStatus === 'safe'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Còn Hạn Dài
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm mã lô, tên sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

        </div>

        {/* Batches Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">MÃ LÔ HÀNG</th>
                <th className="py-3 px-4">SẢN PHẨM & QUY CÁCH</th>
                <th className="py-3 px-4">VỊ TRÍ KỆ</th>
                <th className="py-3 px-4">NGÀY NHẬP</th>
                <th className="py-3 px-4">HẠN SỬ DỤNG (FEFO)</th>
                <th className="py-3 px-4 text-right">SỐ LƯỢNG</th>
                <th className="py-3 px-4 text-right">GIÁ NHẬP</th>
                <th className="py-3 px-4 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không tìm thấy lô hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => (
                  <tr
                    key={b.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      b.isExpired ? 'bg-rose-50/30' : b.isExpiringSoon ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Batch Code */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {b.batchCode}
                    </td>

                    {/* Product info */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{b.product?.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {b.product?.unitSize} · Mã: <span className="font-mono">{b.product?.barcode}</span>
                      </div>
                    </td>

                    {/* Shelf Location */}
                    <td className="py-3 px-4 text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                        {b.product?.shelfLocation.shelf}
                      </span>
                    </td>

                    {/* Received Date */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {b.receivedAt}
                    </td>

                    {/* Expiry Date & FEFO Badge */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-900 font-semibold">{b.expiryDate}</div>
                      <div className="mt-0.5">
                        {b.isExpired ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" />
                            QUÁ HẠN ({Math.abs(b.daysLeft)} ngày trước)
                          </span>
                        ) : b.isExpiringSoon ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3" />
                            CẬN HẠN (Còn {b.daysLeft} ngày)
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            Còn {b.daysLeft} ngày
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 tabular-nums text-sm">
                      {b.quantity}
                    </td>

                    {/* Cost Price */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                      {b.costPrice.toLocaleString('vi-VN')} ₫
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustBatchModal(b);
                            setAdjustQuantity(b.quantity);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Điều chỉnh tồn kho"
                        >
                          Kiểm kho
                        </button>

                        {b.isExpired && (
                          <button
                            type="button"
                            onClick={() => handleDisposeExpired(b)}
                            className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors flex items-center gap-1"
                            title="Lập biên bản tiêu hủy"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hủy</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal: New Batch Intake (Phiếu Nhập Hàng) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Phiếu Nhập Kho Lô Hàng Mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewBatch} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chọn sản phẩm nhập</label>
                <select
                  value={newBatchProductId}
                  onChange={(e) => {
                    setNewBatchProductId(e.target.value);
                    const prod = products.find((p) => p.id === e.target.value);
                    if (prod) setNewBatchCostPrice(prod.costPrice);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unitSize}) - {p.shelfLocation.shelf}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã Lô (Batch Lot Code)</label>
                <input
                  type="text"
                  value={newBatchCode}
                  onChange={(e) => setNewBatchCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số lượng nhập</label>
                  <input
                    type="number"
                    min="1"
                    value={newBatchQuantity}
                    onChange={(e) => setNewBatchQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giá nhập (₫)</label>
                  <input
                    type="number"
                    step="1000"
                    value={newBatchCostPrice}
                    onChange={(e) => setNewBatchCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hạn sử dụng (Cách hôm nay bao nhiêu ngày?)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={newBatchExpiryDays}
                    onChange={(e) => setNewBatchExpiryDays(Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-slate-500 font-medium">ngày kể từ ngày nhập</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu & Nhập Vào Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Quantity (Kiểm kho) */}
      {adjustBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Điều Chỉnh Kiểm Kê Lô Hàng</h3>
              <button onClick={() => setAdjustBatchModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <div className="font-mono font-bold text-slate-900">{adjustBatchModal.batchCode}</div>
                <div className="text-slate-600 mt-0.5">
                  Sản phẩm: {products.find((p) => p.id === adjustBatchModal.productId)?.name}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số lượng tồn thực tế sau kiểm kê</label>
                <input
                  type="number"
                  min="0"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do điều chỉnh</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Kiểm kê định kỳ phát hiện thừa/thiếu">Kiểm kê định kỳ phát hiện thừa/thiếu</option>
                  <option value="Hao hụt tự nhiên (bay hơi, rơi vãi)">Hao hụt tự nhiên (bay hơi, rơi vãi)</option>
                  <option value="Bao bì hư hỏng cần loại bỏ">Bao bì hư hỏng cần loại bỏ</option>
                  <option value="Nhập nhầm số liệu chứng từ">Nhập nhầm số liệu chứng từ</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustBatchModal(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdjust}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Cập Nhật Tồn Kho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
