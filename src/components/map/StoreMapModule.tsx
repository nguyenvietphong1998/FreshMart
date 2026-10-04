import React, { useState } from 'react';
import {
  Compass,
  ExternalLink,
  Layers,
  MapPin,
  Navigation,
  Package,
  Phone,
  Search,
  ShoppingCart,
  Store,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateBatchSummary } from '../../services/fefoEngine';
import { Product } from '../../types';

export const StoreMapModule: React.FC = () => {
  const {
    branches,
    currentBranch,
    setCurrentBranch,
    products,
    batches,
    addToCart,
    setActiveTab,
  } = useApp();

  const [selectedShelf, setSelectedShelf] = useState<string>('Kệ A1-01');

  // Shelves configuration inside the store planogram
  const SHELF_ZONES = [
    {
      id: 'Zone-A',
      name: 'Khu Rau Củ Tươi Sạch',
      color: 'bg-emerald-500',
      shelves: ['Kệ A1-01', 'Kệ A1-02', 'Kệ A1-03'],
      desc: 'Nhiệt độ bảo quản 2°C - 8°C, hệ thống phun sương tự động',
    },
    {
      id: 'Zone-B',
      name: 'Khu Thịt Tươi & Thủy Sản',
      color: 'bg-rose-500',
      shelves: ['Kệ Lạnh B2-01', 'Bể Hải Sản B2-03'],
      desc: 'Bảo quản thịt tươi 0°C - 4°C và bể sục oxy hải sản sống',
    },
    {
      id: 'Zone-C',
      name: 'Khu Cấp Đông Sâu (-18°C)',
      color: 'bg-cyan-500',
      shelves: ['Tủ Đông C3-01'],
      desc: 'Tủ kính bảo quản cá hồi Nauy, thực phẩm đông lạnh',
    },
    {
      id: 'Zone-D',
      name: 'Khu Bơ Sữa & Trứng',
      color: 'bg-amber-400',
      shelves: ['Kệ Trứng D4-01', 'Tủ Mát Sữa D4-02', 'Kệ Bơ D4-03'],
      desc: 'Sữa thanh trùng, bơ nhập khẩu, trứng gà tươi chuẩn VietGAP',
    },
    {
      id: 'Zone-E',
      name: 'Khu Gạo & Lương Thực Khô',
      color: 'bg-orange-500',
      shelves: ['Kệ Gạo E5-01', 'Kệ Mì Khô E5-02', 'Kệ Hạt E5-03'],
      desc: 'Khu vực khô ráo, thoáng mát, kiểm soát độ ẩm nghiêm ngặt',
    },
    {
      id: 'Zone-F',
      name: 'Khu Nước Giải Khát & Trà',
      color: 'bg-blue-500',
      shelves: ['Tủ Mát Nước F6-01', 'Kệ Trà F6-02'],
      desc: 'Nước ép trái cây tươi, trà ô long, nước khoáng thiên nhiên',
    },
    {
      id: 'Zone-G',
      name: 'Khu Gia Vị & Dầu Ăn',
      color: 'bg-purple-500',
      shelves: ['Kệ Gia Vị G7-01', 'Kệ Dầu Ăn G7-02'],
      desc: 'Nước mắm truyền thống Phú Quốc, dầu đậu nành nguyên chất',
    },
  ];

  // Get products stored on selected shelf
  const shelfProducts = products.filter((p) => p.shelfLocation.shelf === selectedShelf);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Module Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Bản Đồ Chi Nhánh & Sơ Đồ Kệ Hàng Siêu Thị
        </h2>
        <div className="text-xs text-slate-500 mt-0.5">
          Tích hợp bản đồ OpenStreetMap vị trí cửa hàng và sơ đồ mặt bằng kệ hàng thực phẩm trực quan
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: OpenStreetMap Branch Network (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Mạng Lưới Chi Nhánh (OpenStreetMap)</h3>
              </div>
            </div>

            {/* Embedded OpenStreetMap Viewport */}
            <div className="relative h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <iframe
                title="OpenStreetMap Branch Location"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentBranch.coordinates.lng - 0.01}%2C${currentBranch.coordinates.lat - 0.007}%2C${currentBranch.coordinates.lng + 0.01}%2C${currentBranch.coordinates.lat + 0.007}&layer=mapnik&marker=${currentBranch.coordinates.lat}%2C${currentBranch.coordinates.lng}`}
                className="w-full h-full filter contrast-105"
              />
              <div className="absolute top-2 left-2 bg-white/95 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs text-slate-800 backdrop-blur-xs flex items-center gap-1 border border-slate-200/60">
                <MapPin className="w-3 h-3 text-rose-600" />
                <span>{currentBranch.name}</span>
              </div>
            </div>

            {/* Branch Cards Switcher */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">Danh sách chi nhánh cửa hàng:</div>
              {branches.map((b) => {
                const isCurrent = b.id === currentBranch.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setCurrentBranch(b)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-400/30'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{b.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{b.address}</div>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {b.code}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{b.phone}</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${b.coordinates.lat},${b.coordinates.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Chỉ đường</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Right: Interactive Store Planogram & Shelf Locator (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Sơ Đồ Mặt Bằng Kệ Hàng (Store Planogram)</h3>
              </div>
              <div className="text-[11px] text-slate-500">
                Bấm vào từng kệ để xem danh sách sản phẩm và số lượng tồn
              </div>
            </div>

            {/* Interactive SVG Supermarket Layout */}
            <div className="relative bg-slate-900 rounded-2xl p-4 text-white overflow-hidden shadow-inner">
              <div className="text-[11px] text-slate-400 pb-2 border-b border-slate-800 flex justify-between items-center">
                <span>Cửa Ra Vào &amp; Quầy Thu Ngân (Lối vào chính)</span>
                <span className="text-emerald-400 font-bold">Kệ đang chọn: {selectedShelf}</span>
              </div>

              {/* Floor Layout Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3">
                {SHELF_ZONES.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${zone.color} shrink-0`} />
                        <span className="font-bold text-xs text-slate-200 line-clamp-1">{zone.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-tight line-clamp-2">
                        {zone.desc}
                      </div>
                    </div>

                    {/* Shelf buttons */}
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-700/50">
                      {zone.shelves.map((sh) => {
                        const isSelected = selectedShelf === sh;
                        return (
                          <button
                            key={sh}
                            type="button"
                            onClick={() => setSelectedShelf(sh)}
                            className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-all ${
                              isSelected
                                ? 'bg-emerald-500 text-white shadow-xs font-bold ring-2 ring-emerald-300'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            }`}
                          >
                            {sh}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Entrance Bar */}
              <div className="mt-3 pt-2 border-t border-slate-800 text-center text-[10px] text-slate-400 uppercase tracking-widest">
                [ CỬA VÀO SIÊU THỊ · QUẦY THU NGÂN POS 1 &amp; POS 2 ]
              </div>
            </div>

            {/* Display products on selected shelf */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Sản phẩm đang được bày trên <span className="text-emerald-700 font-mono">{selectedShelf}</span>
                  </h4>
                  <div className="text-[11px] text-slate-500">
                    Chi nhánh: {currentBranch.name} · Số lượng mặt hàng: {shelfProducts.length}
                  </div>
                </div>
              </div>

              {shelfProducts.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Chưa có sản phẩm nào được gán trên kệ này.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shelfProducts.map((p) => {
                    const stock = calculateBatchSummary(p.id, currentBranch.id, batches);
                    return (
                      <div
                        key={p.id}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {p.unitSize} · {p.sellingPrice.toLocaleString('vi-VN')} ₫
                          </div>
                          <div className="text-[10px] text-emerald-700 mt-1">
                            Tồn khả dụng: <strong>{stock.safe + stock.expiringSoon}</strong> món
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            addToCart(p, 1);
                            setActiveTab('pos');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 shadow-xs flex items-center gap-1"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Bán</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
