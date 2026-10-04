import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Barcode,
  Calendar,
  Check,
  Clock,
  CupSoda,
  Egg,
  Fish,
  Flame,
  Leaf,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  Wheat,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CATEGORY_LABELS } from '../../data/seedData';
import { calculateBatchSummary, getDaysUntilExpiry } from '../../services/fefoEngine';
import { FoodCategory, Invoice, Product } from '../../types';
import { PaymentModal } from './PaymentModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';

export const PosModule: React.FC = () => {
  const {
    products,
    batches,
    currentBranch,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    appliedPromotion,
    applyPromotion,
    removePromotion,
    cartSubtotal,
    cartDiscount,
    cartFinalTotal,
    promotions,
    lastCompletedInvoice,
    setLastCompletedInvoice,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [promoInput, setPromoInput] = useState<string>('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);

  // Category Icon Resolver
  const getCategoryIcon = (cat: FoodCategory) => {
    switch (cat) {
      case 'vegetable':
        return <Leaf className="w-3.5 h-3.5" />;
      case 'meat_fish':
        return <Fish className="w-3.5 h-3.5" />;
      case 'dairy_egg':
        return <Egg className="w-3.5 h-3.5" />;
      case 'dry_food':
        return <Wheat className="w-3.5 h-3.5" />;
      case 'beverage':
        return <CupSoda className="w-3.5 h-3.5" />;
      case 'spice_oil':
        return <Flame className="w-3.5 h-3.5" />;
      default:
        return <Package className="w-3.5 h-3.5" />;
    }
  };

  // Filter products by branch stock, search query and category
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category filter
      if (selectedCategory !== 'all' && prod.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = prod.name.toLowerCase().includes(q);
        const matchBarcode = prod.barcode.includes(q);
        const matchManufacturer = prod.manufacturer.toLowerCase().includes(q);
        if (!matchName && !matchBarcode && !matchManufacturer) return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle Barcode Scan / Enter
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!barcodeInput.trim()) return;

    const code = barcodeInput.trim();
    const found = products.find((p) => p.barcode === code);
    if (found) {
      const res = addToCart(found, 1);
      if (!res.success) {
        setCartFeedback(res.message || 'Không đủ tồn kho');
      } else {
        setCartFeedback(`Đã thêm: ${found.name}`);
      }
      setBarcodeInput('');
    } else {
      setCartFeedback(`Không tìm thấy sản phẩm có mã vạch ${code}`);
    }

    setTimeout(() => setCartFeedback(null), 3000);
  };

  const handleQuickScan = (barcode: string) => {
    setBarcodeInput(barcode);
    const found = products.find((p) => p.barcode === barcode);
    if (found) {
      const res = addToCart(found, 1);
      if (!res.success) {
        setCartFeedback(res.message || 'Hết hàng');
      } else {
        setCartFeedback(`Quét thành công: ${found.name}`);
      }
    }
    setTimeout(() => setCartFeedback(null), 3000);
  };

  const handleApplyPromoCode = () => {
    if (!promoInput.trim()) return;
    const res = applyPromotion(promoInput.trim());
    setPromoMessage({ text: res.message, error: !res.success });
    if (res.success) setPromoInput('');
    setTimeout(() => setPromoMessage(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      
      {/* Feedback Banner if scan triggered */}
      {cartFeedback && (
        <div className="mb-3 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between shadow-md transition-all animate-in fade-in">
          <span>{cartFeedback}</span>
          <button onClick={() => setCartFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Product Catalog & Quick Filters (8 cols on lg) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Top Search & Barcode Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
              
              {/* Product search input */}
              <div className="md:col-span-7 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm theo tên, danh mục, nhà sản xuất..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Barcode scanner simulator input */}
              <form onSubmit={handleBarcodeSubmit} className="md:col-span-5 relative flex gap-1.5">
                <div className="relative grow">
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Quét mã vạch (EAN-13)..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shrink-0"
                >
                  Nhập
                </button>
              </form>

            </div>

            {/* Quick Barcode Scanner Samples */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-500 pt-1 border-t border-slate-100 no-scrollbar">
              <span className="font-semibold text-slate-700 shrink-0">Mô phỏng quét nhanh:</span>
              {[
                { name: 'Rau muống', code: '893600101001' },
                { name: 'Ba chỉ CP', code: '893600102001' },
                { name: 'Dalat Milk', code: '893600103002' },
                { name: 'Gạo ST25', code: '893600104001' },
                { name: 'Cá hồi Nauy', code: '893600102002' },
              ].map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => handleQuickScan(sample.code)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors shrink-0 font-medium border border-slate-200/60"
                >
                  {sample.name}
                </button>
              ))}
            </div>

          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 border ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Tất Cả Món</span>
              <span className="text-[10px] opacity-80">({products.length})</span>
            </button>

            {(Object.keys(CATEGORY_LABELS) as FoodCategory[]).map((cat) => {
              const meta = CATEGORY_LABELS[cat];
              const count = products.filter((p) => p.category === cat).length;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {getCategoryIcon(cat)}
                  <span>{meta.label}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredProducts.map((prod) => {
              const stock = calculateBatchSummary(prod.id, currentBranch.id, batches);
              const isOutOfStock = stock.safe + stock.expiringSoon <= 0;

              // Find earliest expiring batch for tag
              const validBatches = batches
                .filter((b) => b.productId === prod.id && b.branchId === currentBranch.id && b.quantity > 0)
                .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

              const earliestBatch = validBatches[0];
              const daysLeft = earliestBatch ? getDaysUntilExpiry(earliestBatch.expiryDate) : null;

              return (
                <div
                  key={prod.id}
                  className={`bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                    isOutOfStock ? 'opacity-60 bg-slate-50' : ''
                  }`}
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative h-36 bg-slate-100 overflow-hidden">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback container when image fails
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="text-[10px] font-bold tracking-tight bg-slate-900/80 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
                          {prod.unitSize}
                        </span>
                      </div>

                      {/* Shelf location indicator badge */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-semibold bg-white/90 text-slate-800 px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{prod.shelfLocation.shelf}</span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-3.5 space-y-2">
                      <div className="text-[11px] text-slate-400 font-medium line-clamp-1">
                        {prod.manufacturer}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 min-h-[32px]">
                        {prod.name}
                      </h4>

                      {/* FEFO Expiry & Stock Tag */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-500 font-mono">
                          Tồn: <strong className="text-slate-900">{stock.safe + stock.expiringSoon}</strong>
                        </span>

                        {daysLeft !== null && (
                          <span
                            className={`flex items-center gap-1 font-semibold text-[10px] px-1.5 py-0.5 rounded ${
                              daysLeft <= 0
                                ? 'bg-rose-50 text-rose-700'
                                : daysLeft <= 7
                                ? 'bg-amber-50 text-amber-800'
                                : 'text-slate-500'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {daysLeft <= 0 ? 'Hết hạn' : `HSD: ${daysLeft} ngày`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price & Add to Cart button */}
                  <div className="px-3.5 pb-3.5 pt-1 flex items-center justify-between border-t border-slate-100">
                    <div className="font-extrabold text-sm text-slate-900 font-mono tabular-nums">
                      {prod.sellingPrice.toLocaleString('vi-VN')} ₫
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const res = addToCart(prod, 1);
                        if (!res.success) {
                          setCartFeedback(res.message || 'Không đủ hàng');
                          setTimeout(() => setCartFeedback(null), 3000);
                        }
                      }}
                      disabled={isOutOfStock}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: POS Cart & Checkout (5 cols on lg, 4 on xl) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md sticky top-20 overflow-hidden flex flex-col max-h-[calc(100vh-100px)]">
            
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Giỏ Hàng Quầy Thu Ngân</h3>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa hết</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="p-3 overflow-y-auto space-y-2.5 grow divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                  <div className="text-xs font-medium">Chưa có sản phẩm nào trong giỏ</div>
                  <div className="text-[11px] text-slate-400">
                    Bấm chọn sản phẩm hoặc quét mã vạch để bán hàng
                  </div>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="pt-2.5 first:pt-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-snug">{item.product.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.product.unitSize} · {item.product.sellingPrice.toLocaleString('vi-VN')} ₫
                        </div>
                      </div>
                      <div className="text-xs font-extrabold text-slate-900 font-mono tabular-nums shrink-0">
                        {(item.product.sellingPrice * item.quantity).toLocaleString('vi-VN')} ₫
                      </div>
                    </div>

                    {/* FEFO Batch Allocation Trace */}
                    <div className="text-[10px] text-emerald-700 bg-emerald-50/70 p-1 rounded border border-emerald-100 space-y-0.5">
                      <div className="font-semibold flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        <span>Xuất theo lô FEFO:</span>
                      </div>
                      {item.batchesAllocated.map((b) => (
                        <div key={b.batchId} className="flex justify-between text-[9px] text-slate-600">
                          <span>
                            Lô <strong>{b.batchCode}</strong> ({b.quantity} món)
                          </span>
                          <span className={b.daysUntilExpiry <= 7 ? 'text-amber-700 font-bold' : ''}>
                            HSD: {b.daysUntilExpiry} ngày
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Quantity Stepper & Remove */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold font-mono tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 text-xs p-1"
                        title="Xóa món này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Promotions Section */}
            {cart.length > 0 && (
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Mã khuyến mãi</span>
                  </span>
                  {appliedPromotion && (
                    <button
                      onClick={removePromotion}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Bỏ áp dụng
                    </button>
                  )}
                </div>

                {!appliedPromotion ? (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Nhập mã (FRESH10, GIAM20K...)"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        className="grow px-2.5 py-1.5 text-xs uppercase font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromoCode}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                      >
                        Áp Dụng
                      </button>
                    </div>

                    {/* Quick promo tags */}
                    <div className="flex flex-wrap gap-1">
                      {promotions.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => applyPromotion(p.code)}
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 transition-colors"
                        >
                          {p.code}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                    <div>
                      <div className="font-bold text-emerald-900">{appliedPromotion.name}</div>
                      <div className="text-[10px] text-emerald-700 font-mono">Mã: {appliedPromotion.code}</div>
                    </div>
                    <div className="font-extrabold text-emerald-700 font-mono tabular-nums">
                      -{cartDiscount.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                )}

                {promoMessage && (
                  <div
                    className={`text-[11px] font-medium p-1.5 rounded ${
                      promoMessage.error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {promoMessage.text}
                  </div>
                )}
              </div>
            )}

            {/* Financial Summary & Checkout CTA */}
            <div className="p-4 border-t border-slate-200 bg-white space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Tiền hàng:</span>
                  <span className="font-mono tabular-nums">{cartSubtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Khuyến mãi:</span>
                    <span className="font-mono tabular-nums">-{cartDiscount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-900">Khách phải trả:</span>
                  <span className="text-xl font-extrabold text-emerald-700 font-mono tabular-nums">
                    {cartFinalTotal.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={cart.length === 0}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>THANH TOÁN (F9)</span>
                <span className="font-mono font-bold">· {cartFinalTotal.toLocaleString('vi-VN')} ₫</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={(_invoice) => {
          setIsPaymentModalOpen(false);
        }}
      />

      {/* 80mm Thermal Receipt Modal for Last Completed Invoice */}
      <ThermalReceiptModal
        invoice={lastCompletedInvoice}
        onClose={() => setLastCompletedInvoice(null)}
      />

    </div>
  );
};
