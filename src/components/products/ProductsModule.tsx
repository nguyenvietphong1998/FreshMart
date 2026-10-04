import React, { useRef, useState } from 'react';
import {
  Barcode,
  Check,
  Download,
  Edit2,
  FileSpreadsheet,
  Filter,
  Image as ImageIcon,
  Package,
  Plus,
  Search,
  Tag,
  Upload,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CATEGORY_LABELS } from '../../data/seedData';
import { calculateBatchSummary } from '../../services/fefoEngine';
import { FoodCategory, Product } from '../../types';

const FOOD_IMAGE_PRESETS = [
  { name: 'Rau xanh', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80' },
  { name: 'Cà chua', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80' },
  { name: 'Nấm tươi', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
  { name: 'Thịt tươi', url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80' },
  { name: 'Cá hồi', url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80' },
  { name: 'Tôm tươi', url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=400&q=80' },
  { name: 'Trứng gà', url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sữa tươi', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80' },
  { name: 'Bơ lạt', url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80' },
  { name: 'Gạo ST25', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
  { name: 'Nước ép', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80' },
  { name: 'Gia vị', url: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=400&q=80' },
];

export const ProductsModule: React.FC = () => {
  const { products, batches, currentBranch, addProduct, updateProduct, currentRole } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState<FoodCategory>('vegetable');
  const [formManufacturer, setFormManufacturer] = useState('');
  const [formUnitSize, setFormUnitSize] = useState('Gói 500g');
  const [formCostPrice, setFormCostPrice] = useState<number>(20000);
  const [formSellingPrice, setFormSellingPrice] = useState<number>(30000);
  const [formShelf, setFormShelf] = useState('Kệ A1-01');
  const [formStorage, setFormStorage] = useState('Nhiệt độ phòng');
  const [formImageUrl, setFormImageUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.manufacturer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBarcode('893' + Math.floor(100000000 + Math.random() * 900000000));
    setFormCategory('vegetable');
    setFormManufacturer('Nông Sản Sạch Việt Nam');
    setFormUnitSize('Gói 500g');
    setFormCostPrice(20000);
    setFormSellingPrice(29000);
    setFormShelf('Kệ A1-01');
    setFormStorage('2°C - 8°C');
    setFormImageUrl(FOOD_IMAGE_PRESETS[0].url);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormBarcode(p.barcode);
    setFormCategory(p.category);
    setFormManufacturer(p.manufacturer);
    setFormUnitSize(p.unitSize);
    setFormCostPrice(p.costPrice);
    setFormSellingPrice(p.sellingPrice);
    setFormShelf(p.shelfLocation.shelf);
    setFormStorage(p.storageCondition);
    setFormImageUrl(p.imageUrl || FOOD_IMAGE_PRESETS[0].url);
    setIsModalOpen(true);
  };

  // Handle local file upload (converts to base64 data url)
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
        setFormImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBarcode.trim()) return;

    const finalImage = formImageUrl.trim() || FOOD_IMAGE_PRESETS[0].url;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name: formName.trim(),
        barcode: formBarcode.trim(),
        category: formCategory,
        manufacturer: formManufacturer.trim(),
        unitSize: formUnitSize.trim(),
        costPrice: Number(formCostPrice),
        sellingPrice: Number(formSellingPrice),
        shelfLocation: {
          zone: 'Khu Trưng Bày',
          aisle: 'Dãy 01',
          shelf: formShelf,
        },
        storageCondition: formStorage,
        imageUrl: finalImage,
      });
    } else {
      addProduct({
        id: 'prod-' + Date.now(),
        name: formName.trim(),
        barcode: formBarcode.trim(),
        category: formCategory,
        manufacturer: formManufacturer.trim(),
        unitSize: formUnitSize.trim(),
        costPrice: Number(formCostPrice),
        sellingPrice: Number(formSellingPrice),
        shelfLocation: {
          zone: 'Khu Trưng Bày',
          aisle: 'Dãy 01',
          shelf: formShelf,
        },
        storageCondition: formStorage,
        minStockThreshold: 10,
        imageUrl: finalImage,
      });
    }
    setIsModalOpen(false);
  };

  const isActionAllowed = currentRole === 'admin' || currentRole === 'warehouse_manager';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Danh Mục Sản Phẩm &amp; Giá Niêm Yết
          </h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Quản lý hình ảnh, mã vạch, quy cách đóng gói, giá vốn, giá bán lẻ và vị trí kệ hàng thực phẩm
          </div>
        </div>

        {isActionAllowed && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Sản Phẩm Mới</span>
          </button>
        )}
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        {/* Search & Category Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tất Cả ({products.length})
            </button>
            {(Object.keys(CATEGORY_LABELS) as FoodCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {CATEGORY_LABELS[cat].label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm tên, mã vạch, nhà sản xuất..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">HÌNH ẢNH</th>
                <th className="py-3 px-4">MÃ VẠCH (BARCODE)</th>
                <th className="py-3 px-4">TÊN SẢN PHẨM</th>
                <th className="py-3 px-4">DANH MỤC</th>
                <th className="py-3 px-4">QUY CÁCH</th>
                <th className="py-3 px-4">VỊ TRÍ KỆ</th>
                <th className="py-3 px-4 text-right">GIÁ VỐN</th>
                <th className="py-3 px-4 text-right">GIÁ BÁN</th>
                <th className="py-3 px-4 text-right">TỒN CHI NHÁNH</th>
                <th className="py-3 px-4 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const stock = calculateBatchSummary(p.id, currentBranch.id, batches);
                const profitMargin = Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Thumbnail Image */}
                    <td className="py-3 px-4">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.barcode}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.manufacturer}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-700 font-medium">
                        {CATEGORY_LABELS[p.category]?.label || p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">{p.unitSize}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                        {p.shelfLocation.shelf}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                      {p.costPrice.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                      <div>{p.sellingPrice.toLocaleString('vi-VN')} ₫</div>
                      <div className="text-[10px] text-emerald-600 font-normal">+{profitMargin}% lãi</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span className="font-bold text-slate-900">{stock.safe + stock.expiringSoon}</span>
                      {stock.expiringSoon > 0 && (
                        <div className="text-[10px] text-amber-700">({stock.expiringSoon} cận date)</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isActionAllowed ? (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Chỉnh sửa sản phẩm"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chỉ xem</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Add / Edit Product with Image Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingProduct ? 'Chỉnh Sửa Sản Phẩm Thực Phẩm' : 'Thêm Sản Phẩm Mới Vào Hệ Thống'}
                </h3>
                <div className="text-[11px] text-slate-500">
                  Cập nhật thông tin chi tiết và ảnh thực phẩm hiển thị trên quầy POS
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 pt-4 text-xs">
              
              {/* Product Image Upload & Preset Selector */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Ảnh Sản Phẩm (Hiển thị trên POS và Kệ Hàng)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Live Preview Box */}
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-white border border-slate-300 shadow-xs shrink-0 relative group">
                    {formImageUrl ? (
                      <img
                        src={formImageUrl}
                        alt="Xem trước ảnh"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                        <ImageIcon className="w-6 h-6 stroke-1 mb-1" />
                        <span className="text-[10px]">Chưa có ảnh</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions & URL input */}
                  <div className="space-y-2 grow w-full">
                    {/* File upload button */}
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
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải ảnh từ máy / điện thoại</span>
                      </button>

                      {formImageUrl && (
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold"
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>

                    {/* Image URL input */}
                    <div>
                      <input
                        type="url"
                        placeholder="Hoặc dán liên kết URL ảnh thực phẩm tại đây..."
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Fast Picker */}
                <div>
                  <div className="text-[10px] text-slate-500 font-medium mb-1.5">
                    Hoặc chọn nhanh ảnh mẫu có sẵn:
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-6 gap-1.5">
                    {FOOD_IMAGE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormImageUrl(preset.url)}
                        className={`h-11 rounded-lg overflow-hidden border relative transition-all group ${
                          formImageUrl === preset.url
                            ? 'ring-2 ring-emerald-500 border-emerald-500'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        {formImageUrl === preset.url && (
                          <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Text Fields Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Tên sản phẩm</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 font-medium"
                    placeholder="VD: Rau Cải Bẹ Xanh VietGAP..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã vạch (Barcode EAN-13)</label>
                  <input
                    type="text"
                    required
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Danh mục thực phẩm</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as FoodCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    {(Object.keys(CATEGORY_LABELS) as FoodCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nhà sản xuất / Nông trại</label>
                  <input
                    type="text"
                    value={formManufacturer}
                    onChange={(e) => setFormManufacturer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quy cách (Size/ĐVT)</label>
                  <input
                    type="text"
                    value={formUnitSize}
                    onChange={(e) => setFormUnitSize(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="VD: Túi 500g, Hộp 1L..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giá vốn cơ sở (₫)</label>
                  <input
                    type="number"
                    step="1000"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giá bán niêm yết (₫)</label>
                  <input
                    type="number"
                    step="1000"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vị trí kệ trưng bày</label>
                  <input
                    type="text"
                    value={formShelf}
                    onChange={(e) => setFormShelf(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="VD: Kệ A1-01"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Điều kiện bảo quản</label>
                  <input
                    type="text"
                    value={formStorage}
                    onChange={(e) => setFormStorage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="VD: 2°C - 8°C"
                  />
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
                  Lưu Sản Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
