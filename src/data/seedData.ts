import { Branch, Customer, FoodCategory, Product, Promotion, StockBatch } from '../types';

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'branch-hcm-01',
    code: 'HCM-Q1',
    name: 'FreshMart Quận 1 (Flagship Store)',
    address: '72 Lê Thánh Tôn, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '028 3822 5588',
    openingHours: '06:30 - 22:00 hàng ngày',
    coordinates: { lat: 10.7782, lng: 106.7022 },
    managerName: 'Trần Văn Nam',
  },
  {
    id: 'branch-hn-01',
    code: 'HN-CG',
    name: 'FreshMart Cầu Giấy',
    address: '122 Đường Cầu Giấy, P. Quan Hoa, Cầu Giấy, Hà Nội',
    phone: '024 3768 9911',
    openingHours: '06:30 - 21:30 hàng ngày',
    coordinates: { lat: 21.0333, lng: 105.7958 },
    managerName: 'Nguyễn Thị Minh',
  },
  {
    id: 'branch-dn-01',
    code: 'DN-HC',
    name: 'FreshMart Hải Châu',
    address: '54 Bạch Đằng, P. Thạch Thang, Hải Châu, Đà Nẵng',
    phone: '0236 388 7766',
    openingHours: '07:00 - 21:30 hàng ngày',
    coordinates: { lat: 16.0717, lng: 108.2234 },
    managerName: 'Lê Hoàng Long',
  },
];

export const CATEGORY_LABELS: Record<FoodCategory, { label: string; icon: string }> = {
  vegetable: { label: 'Rau Củ Quả', icon: 'Leaf' },
  meat_fish: { label: 'Thịt & Thủy Sản', icon: 'Fish' },
  dairy_egg: { label: 'Sữa & Trứng', icon: 'Egg' },
  dry_food: { label: 'Gạo & Đồ Khô', icon: 'Wheat' },
  beverage: { label: 'Nước Giải Khát', icon: 'CupSoda' },
  spice_oil: { label: 'Gia Vị & Dầu Ăn', icon: 'Flame' },
};

export const INITIAL_PRODUCTS: Product[] = [
  // 1. Rau củ quả
  {
    id: 'prod-001',
    barcode: '893600101001',
    name: 'Rau Muống Thủy Canh VietGAP',
    category: 'vegetable',
    manufacturer: 'Đà Lạt Eco Farm',
    unitSize: 'Túi 500g',
    costPrice: 12000,
    sellingPrice: 19000,
    shelfLocation: { zone: 'Khu Mát A', aisle: 'Dãy 01', shelf: 'Kệ A1-01' },
    storageCondition: '2°C - 8°C (Ngăn rau mát)',
    minStockThreshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'prod-002',
    barcode: '893600101002',
    name: 'Cà Chua Beef Hữu Cơ Đà Lạt',
    category: 'vegetable',
    manufacturer: 'Đà Lạt Eco Farm',
    unitSize: 'Túi 1kg',
    costPrice: 28000,
    sellingPrice: 42000,
    shelfLocation: { zone: 'Khu Mát A', aisle: 'Dãy 01', shelf: 'Kệ A1-02' },
    storageCondition: '10°C - 15°C hoặc nhiệt độ phòng thoáng',
    minStockThreshold: 8,
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'prod-003',
    barcode: '893600101003',
    name: 'Nấm Kim Châm Tươi',
    category: 'vegetable',
    manufacturer: 'Biovegi Farm',
    unitSize: 'Gói 200g',
    costPrice: 9000,
    sellingPrice: 15000,
    shelfLocation: { zone: 'Khu Mát A', aisle: 'Dãy 01', shelf: 'Kệ A1-03' },
    storageCondition: '1°C - 5°C',
    minStockThreshold: 15,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
  },

  // 2. Thịt & Thủy hải sản
  {
    id: 'prod-004',
    barcode: '893600102001',
    name: 'Thịt Ba Chỉ Heo CP Chuẩn Quế',
    category: 'meat_fish',
    manufacturer: 'CP Foods Vietnam',
    unitSize: 'Khay 500g',
    costPrice: 65000,
    sellingPrice: 98000,
    shelfLocation: { zone: 'Khu Thịt Tươi B', aisle: 'Dãy 02', shelf: 'Kệ Lạnh B2-01' },
    storageCondition: '0°C - 4°C (Tủ lạnh bảo quản thịt)',
    minStockThreshold: 8,
    imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'prod-005',
    barcode: '893600102002',
    name: 'Fillet Cá Hồi Tươi Nauy Cấp Đông Sâu',
    category: 'meat_fish',
    manufacturer: 'Lerøy Seafood Norway',
    unitSize: 'Khay 300g',
    costPrice: 145000,
    sellingPrice: 198000,
    shelfLocation: { zone: 'Khu Đông Lạnh C', aisle: 'Dãy 03', shelf: 'Tủ Đông C3-01' },
    storageCondition: '-18°C (Tủ đông sâu chuyên dụng)',
    minStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'prod-006',
    barcode: '893600102003',
    name: 'Tôm Thẻ Chân Trắng Tươi Sinh Thái',
    category: 'meat_fish',
    manufacturer: 'Minh Phú Seafood',
    unitSize: 'Hộp 500g',
    costPrice: 85000,
    sellingPrice: 125000,
    shelfLocation: { zone: 'Khu Thịt Tươi B', aisle: 'Dãy 02', shelf: 'Bể Hải Sản B2-03' },
    storageCondition: 'Đá ướp 0°C - 2°C',
    minStockThreshold: 6,
    imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=300&q=80',
  },

  // 3. Sữa & Trứng
  {
    id: 'prod-007',
    barcode: '893600103001',
    name: 'Trứng Gà Ta Tươi Ba Huân',
    category: 'dairy_egg',
    manufacturer: 'Ba Huân Farm',
    unitSize: 'Hộp 10 quả',
    costPrice: 26000,
    sellingPrice: 38000,
    shelfLocation: { zone: 'Khu Bơ Sữa D', aisle: 'Dãy 04', shelf: 'Kệ Trứng D4-01' },
    storageCondition: 'Nhiệt độ phòng hoặc ngăn mát 10°C',
    minStockThreshold: 12,
    imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'prod-008',
    barcode: '893600103002',
    name: 'Sữa Tươi Thanh Trùng Dalat Milk Ít Đường',
    category: 'dairy_egg',
    manufacturer: 'Dalat Milk',
    unitSize: 'Chai 950ml',
    costPrice: 35000,
    sellingPrice: 49000,
    shelfLocation: { zone: 'Khu Bơ Sữa D', aisle: 'Dãy 04', shelf: 'Tủ Mát Sữa D4-02' },
    storageCondition: '2°C - 6°C (Hạn dùng ngắn sau mở nắp)',
    minStockThreshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'prod-009',
    barcode: '893600103003',
    name: 'Bơ Lạt Tự Nhiên Anchor New Zealand',
    category: 'dairy_egg',
    manufacturer: 'Fonterra New Zealand',
    unitSize: 'Khối 227g',
    costPrice: 58000,
    sellingPrice: 82000,
    shelfLocation: { zone: 'Khu Bơ Sữa D', aisle: 'Dãy 04', shelf: 'Kệ Bơ D4-03' },
    storageCondition: '-18°C hoặc 2°C - 4°C',
    minStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=300&q=80',
  },

  // 4. Gạo & Đồ khô
  {
    id: 'prod-010',
    barcode: '893600104001',
    name: 'Gạo Thơm Thượng Hạng ST25 Ông Cua',
    category: 'dry_food',
    manufacturer: 'DNTN Hồ Quang Trí (Sóc Trăng)',
    unitSize: 'Túi 5kg',
    costPrice: 155000,
    sellingPrice: 215000,
    shelfLocation: { zone: 'Khu Lương Thực E', aisle: 'Dãy 05', shelf: 'Kệ Gạo E5-01' },
    storageCondition: 'Nơi khô ráo, thoáng mát, tránh ẩm',
    minStockThreshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'prod-011',
    barcode: '893600104002',
    name: 'Mì Trứng Thượng Hạng Safoco',
    category: 'dry_food',
    manufacturer: 'Safoco Food Joint Stock',
    unitSize: 'Gói 500g',
    costPrice: 20000,
    sellingPrice: 29000,
    shelfLocation: { zone: 'Khu Lương Thực E', aisle: 'Dãy 05', shelf: 'Kệ Mì Khô E5-02' },
    storageCondition: 'Nhiệt độ phòng thoáng mát',
    minStockThreshold: 15,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'prod-012',
    barcode: '893600104003',
    name: 'Hạt Điều Rang Muối Bình Phước Thượng Hạng',
    category: 'dry_food',
    manufacturer: 'Đặc Sản Bình Phước',
    unitSize: 'Hũ 400g',
    costPrice: 95000,
    sellingPrice: 145000,
    shelfLocation: { zone: 'Khu Lương Thực E', aisle: 'Dãy 05', shelf: 'Kệ Hạt E5-03' },
    storageCondition: 'Kín gió, nhiệt độ thường',
    minStockThreshold: 6,
    imageUrl: 'https://images.unsplash.com/photo-1536591375315-1b83687e2f57?auto=format&fit=crop&w=300&q=80',
  },

  // 5. Nước giải khát
  {
    id: 'prod-013',
    barcode: '893600105001',
    name: 'Nước Ép Cam Tép Tươi Vfresh 100%',
    category: 'beverage',
    manufacturer: 'Vinamilk Beverage',
    unitSize: 'Hộp 1L',
    costPrice: 38000,
    sellingPrice: 52000,
    shelfLocation: { zone: 'Khu Nước Giải Khát F', aisle: 'Dãy 06', shelf: 'Tủ Mát Nước F6-01' },
    storageCondition: 'Ngon hơn khi uống lạnh',
    minStockThreshold: 12,
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'prod-014',
    barcode: '893600105002',
    name: 'Trà Xanh Shan Tuyết Cổ Thụ Hà Giang',
    category: 'beverage',
    manufacturer: 'Trà Việt Heritage',
    unitSize: 'Hộp 100g',
    costPrice: 110000,
    sellingPrice: 175000,
    shelfLocation: { zone: 'Khu Nước Giải Khát F', aisle: 'Dãy 06', shelf: 'Kệ Trà F6-02' },
    storageCondition: 'Khô ráo, kín nắp',
    minStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=300&q=80',
  },

  // 6. Gia vị & Dầu ăn
  {
    id: 'prod-015',
    barcode: '893600106001',
    name: 'Nước Mắm Cốt Nhĩ Phú Quốc 40 Độ Đạm',
    category: 'spice_oil',
    manufacturer: 'Khải Hoàn Phú Quốc',
    unitSize: 'Chai 520ml',
    costPrice: 62000,
    sellingPrice: 92000,
    shelfLocation: { zone: 'Khu Gia Vị G', aisle: 'Dãy 07', shelf: 'Kệ Gia Vị G7-01' },
    storageCondition: 'Tránh ánh nắng trực tiếp',
    minStockThreshold: 8,
    imageUrl: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'prod-016',
    barcode: '893600106002',
    name: 'Dầu Ăn Đậu Nành Tinh Luyện Simply',
    category: 'spice_oil',
    manufacturer: 'Cai Lan Oils & Fats',
    unitSize: 'Chai 1L',
    costPrice: 42000,
    sellingPrice: 59000,
    shelfLocation: { zone: 'Khu Gia Vị G', aisle: 'Dãy 07', shelf: 'Kệ Dầu Ăn G7-02' },
    storageCondition: 'Nơi khô mát',
    minStockThreshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=300&q=80',
  },
];

// Helper to generate dynamic dates relative to current date (e.g. 2026-10-04)
const getRelativeDate = (daysOffset: number): string => {
  const d = new Date(2026, 9, 4); // Current simulated app local date: Oct 4, 2026
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const INITIAL_STOCK_BATCHES: StockBatch[] = [
  // 1. Rau muống (Batch 1: Expiry in 3 days -> WARNING < 7 days; Batch 2: Expiry in 6 days)
  {
    id: 'batch-001-a',
    productId: 'prod-001',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-RM-1002A',
    quantity: 8,
    costPrice: 12000,
    expiryDate: getRelativeDate(3), // 3 days left -> Near expiry
    receivedAt: getRelativeDate(-2),
  },
  {
    id: 'batch-001-b',
    productId: 'prod-001',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-RM-1004B',
    quantity: 15,
    costPrice: 12000,
    expiryDate: getRelativeDate(6), // 6 days left
    receivedAt: getRelativeDate(0),
  },

  // 2. Cà chua beef (Batch 1: 5 days left; Batch 2: 12 days left)
  {
    id: 'batch-002-a',
    productId: 'prod-002',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-CB-0928A',
    quantity: 5,
    costPrice: 28000,
    expiryDate: getRelativeDate(5), // 5 days left
    receivedAt: getRelativeDate(-4),
  },
  {
    id: 'batch-002-b',
    productId: 'prod-002',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-CB-1003B',
    quantity: 20,
    costPrice: 28000,
    expiryDate: getRelativeDate(14),
    receivedAt: getRelativeDate(-1),
  },

  // 3. Nấm kim châm (Batch 1: 2 days left -> URGENT; Batch 2: 9 days left)
  {
    id: 'batch-003-a',
    productId: 'prod-003',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-NKC-1001',
    quantity: 6,
    costPrice: 9000,
    expiryDate: getRelativeDate(2), // 2 days left
    receivedAt: getRelativeDate(-3),
  },
  {
    id: 'batch-003-b',
    productId: 'prod-003',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-NKC-1004',
    quantity: 25,
    costPrice: 9000,
    expiryDate: getRelativeDate(10),
    receivedAt: getRelativeDate(0),
  },

  // 4. Thịt Ba Chỉ CP (Batch 1: 4 days left; Batch 2: 8 days left)
  {
    id: 'batch-004-a',
    productId: 'prod-004',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-BC-1002',
    quantity: 12,
    costPrice: 65000,
    expiryDate: getRelativeDate(4), // 4 days left
    receivedAt: getRelativeDate(-2),
  },
  {
    id: 'batch-004-b',
    productId: 'prod-004',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-BC-1004',
    quantity: 18,
    costPrice: 65000,
    expiryDate: getRelativeDate(8),
    receivedAt: getRelativeDate(0),
  },

  // 5. Fillet Cá Hồi Nauy (Batch 1: 45 days left)
  {
    id: 'batch-005-a',
    productId: 'prod-005',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-CH-0925',
    quantity: 14,
    costPrice: 145000,
    expiryDate: getRelativeDate(45),
    receivedAt: getRelativeDate(-9),
  },

  // 6. Tôm thẻ chân trắng (Batch 1: 2 days left)
  {
    id: 'batch-006-a',
    productId: 'prod-006',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-TOM-1003',
    quantity: 10,
    costPrice: 85000,
    expiryDate: getRelativeDate(2),
    receivedAt: getRelativeDate(-1),
  },

  // 7. Trứng Gà Ba Huân (Batch 1: 18 days left)
  {
    id: 'batch-007-a',
    productId: 'prod-007',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-TG-0930',
    quantity: 35,
    costPrice: 26000,
    expiryDate: getRelativeDate(18),
    receivedAt: getRelativeDate(-4),
  },

  // 8. Sữa Tươi Dalat Milk (Batch 1: 3 days left -> URGENT; Batch 2: 9 days left)
  {
    id: 'batch-008-a',
    productId: 'prod-008',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-DM-1001',
    quantity: 7,
    costPrice: 35000,
    expiryDate: getRelativeDate(3),
    receivedAt: getRelativeDate(-3),
  },
  {
    id: 'batch-008-b',
    productId: 'prod-008',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-DM-1004',
    quantity: 22,
    costPrice: 35000,
    expiryDate: getRelativeDate(9),
    receivedAt: getRelativeDate(0),
  },

  // 9. Bơ Lạt Anchor (Batch 1: 120 days left)
  {
    id: 'batch-009-a',
    productId: 'prod-009',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-ANC-0815',
    quantity: 20,
    costPrice: 58000,
    expiryDate: getRelativeDate(120),
    receivedAt: getRelativeDate(-50),
  },

  // 10. Gạo ST25 (Batch 1: 180 days left)
  {
    id: 'batch-010-a',
    productId: 'prod-010',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-ST25-0920',
    quantity: 40,
    costPrice: 155000,
    expiryDate: getRelativeDate(180),
    receivedAt: getRelativeDate(-14),
  },

  // 11. Mì Trứng Safoco (Batch 1: 240 days left)
  {
    id: 'batch-011-a',
    productId: 'prod-011',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-SAF-0910',
    quantity: 50,
    costPrice: 20000,
    expiryDate: getRelativeDate(240),
    receivedAt: getRelativeDate(-24),
  },

  // 12. Hạt Điều (Batch 1: 90 days left)
  {
    id: 'batch-012-a',
    productId: 'prod-012',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-DIEU-0901',
    quantity: 15,
    costPrice: 95000,
    expiryDate: getRelativeDate(90),
    receivedAt: getRelativeDate(-33),
  },

  // 13. Nước Cam Vfresh (Batch 1: 60 days left)
  {
    id: 'batch-013-a',
    productId: 'prod-013',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-VFR-0820',
    quantity: 28,
    costPrice: 38000,
    expiryDate: getRelativeDate(60),
    receivedAt: getRelativeDate(-45),
  },

  // 14. Trà Shan Tuyết (Batch 1: 300 days left)
  {
    id: 'batch-014-a',
    productId: 'prod-014',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-TRA-0715',
    quantity: 18,
    costPrice: 110000,
    expiryDate: getRelativeDate(300),
    receivedAt: getRelativeDate(-80),
  },

  // 15. Nước Mắm Phú Quốc (Batch 1: 360 days left)
  {
    id: 'batch-015-a',
    productId: 'prod-015',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-NM-0810',
    quantity: 32,
    costPrice: 62000,
    expiryDate: getRelativeDate(360),
    receivedAt: getRelativeDate(-55),
  },

  // 16. Dầu Đậu Nành Simply (Batch 1: 360 days left)
  {
    id: 'batch-016-a',
    productId: 'prod-016',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-SIM-0905',
    quantity: 30,
    costPrice: 42000,
    expiryDate: getRelativeDate(360),
    receivedAt: getRelativeDate(-29),
  },

  // Demo 1 lô hàng đã quá hạn để hiển thị trong cảnh báo kiểm kho (Expired - Blocked from POS sale)
  {
    id: 'batch-expired-01',
    productId: 'prod-001',
    branchId: 'branch-hcm-01',
    batchCode: 'LOT-RM-0925-OLD',
    quantity: 3,
    costPrice: 12000,
    expiryDate: getRelativeDate(-2), // 2 days ago expired!
    receivedAt: getRelativeDate(-7),
  },
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-01',
    code: 'FRESH10',
    name: 'Giảm 10% Rau Củ Quả Tươi',
    type: 'percentage',
    discountValue: 10,
    minOrderValue: 50000,
    applicableCategory: 'vegetable',
    active: true,
    description: 'Giảm ngay 10% cho toàn bộ nhóm Rau Củ Quả tươi khi đơn từ 50.000₫',
  },
  {
    id: 'promo-02',
    code: 'GIAM20K',
    name: 'Khuyến mãi Giờ Vàng 20.000₫',
    type: 'fixed_amount',
    discountValue: 20000,
    minOrderValue: 200000,
    active: true,
    description: 'Giảm 20.000₫ trực tiếp cho hóa đơn bất kỳ từ 200.000₫ trở lên',
  },
  {
    id: 'promo-03',
    code: 'MEAT5',
    name: 'Giảm 5% Thịt & Thủy Sản Tươi',
    type: 'percentage',
    discountValue: 5,
    minOrderValue: 100000,
    applicableCategory: 'meat_fish',
    active: true,
    description: 'Ưu đãi 5% cho hóa đơn mua Thịt heo hoặc Cá hồi từ 100.000₫',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-01',
    phone: '0908123456',
    name: 'Chị Mai Lan (Khách VIP)',
    type: 'vip',
    debtAmount: 0,
    debtLimit: 5000000,
    loyaltyPoints: 340,
  },
  {
    id: 'cust-02',
    phone: '0912345678',
    name: 'Quán Ăn Dì Ba (Khách Buôn)',
    type: 'wholesale',
    debtAmount: 1850000,
    debtLimit: 10000000,
    loyaltyPoints: 1250,
  },
  {
    id: 'cust-03',
    phone: '0987654321',
    name: 'Anh Minh Tuấn',
    type: 'retail',
    debtAmount: 0,
    debtLimit: 0,
    loyaltyPoints: 65,
  },
];
