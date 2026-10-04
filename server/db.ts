import { createClient } from '@libsql/client';
import path from 'path';

// Khởi tạo SQLite Client lưu vào file database cục bộ rms.db
const dbPath = path.resolve(process.cwd(), 'rms.db');
export const db = createClient({
  url: `file:${dbPath}`,
});

export async function initDatabase() {
  // Tạo các bảng dữ liệu nếu chưa tồn tại
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT,
      lat REAL,
      lng REAL,
      manager_name TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      salary_basic INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      avatar_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      manufacturer TEXT,
      unit_size TEXT,
      cost_price INTEGER NOT NULL,
      selling_price INTEGER NOT NULL,
      shelf_zone TEXT,
      shelf_aisle TEXT,
      shelf_code TEXT,
      storage_condition TEXT,
      min_stock_threshold INTEGER DEFAULT 10,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_batches (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      batch_code TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      cost_price INTEGER NOT NULL,
      expiry_date TEXT NOT NULL,
      received_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      discount_value INTEGER NOT NULL,
      min_order_value INTEGER DEFAULT 0,
      applicable_category TEXT,
      applicable_product_id TEXT,
      active INTEGER DEFAULT 1,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'retail',
      debt_amount INTEGER DEFAULT 0,
      debt_limit INTEGER DEFAULT 2000000,
      loyalty_points INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      client_id TEXT UNIQUE NOT NULL,
      branch_id TEXT NOT NULL,
      cashier_id TEXT,
      cashier_name TEXT,
      cashier_role TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      subtotal INTEGER NOT NULL,
      discount_total INTEGER DEFAULT 0,
      applied_promotion_code TEXT,
      final_total INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      cash_given INTEGER,
      change_return INTEGER,
      payment_ref TEXT,
      status TEXT DEFAULT 'completed',
      cancel_reason TEXT,
      is_offline_sync INTEGER DEFAULT 0,
      stock_conflict INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      barcode TEXT NOT NULL,
      unit_size TEXT,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      discount INTEGER DEFAULT 0,
      total INTEGER NOT NULL,
      batches_json TEXT,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );
  `);

  // Kiểm tra và seed dữ liệu ban đầu nếu bảng rỗng
  const checkBranches = await db.execute('SELECT COUNT(*) as count FROM branches');
  const count = Number(checkBranches.rows[0].count);

  if (count === 0) {
    console.log('Seeding initial data into SQLite...');
    await seedInitialData();
  }
}

async function seedInitialData() {
  // 1. Branches
  const branches = [
    {
      id: 'branch-hcm-01',
      code: 'HCM-Q1',
      name: 'FreshMart Quận 1 (Flagship Store)',
      address: '128 Nguyễn Thị Minh Khai, P. Bến Thành, Q.1, TP.HCM',
      phone: '028 3822 5588',
      lat: 10.776889,
      lng: 106.690321,
      manager_name: 'Trần Văn Nam',
    },
    {
      id: 'branch-hcm-02',
      code: 'HCM-BTH',
      name: 'FreshMart Bình Thạnh',
      address: '45 Đinh Bộ Lĩnh, P. 26, Q. Bình Thạnh, TP.HCM',
      phone: '028 3511 6677',
      lat: 10.803214,
      lng: 106.711456,
      manager_name: 'Nguyễn Thị Mai',
    },
    {
      id: 'branch-hn-01',
      code: 'HN-CG',
      name: 'FreshMart Cầu Giấy',
      address: '88 Cầu Giấy, P. Quan Hoa, Q. Cầu Giấy, Hà Nội',
      phone: '024 3767 8899',
      lat: 21.033333,
      lng: 105.795833,
      manager_name: 'Lê Hoàng Anh',
    },
  ];

  for (const b of branches) {
    await db.execute({
      sql: 'INSERT INTO branches (id, code, name, address, phone, lat, lng, manager_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [b.id, b.code, b.name, b.address, b.phone, b.lat, b.lng, b.manager_name],
    });
  }

  // 2. Users (4 roles)
  const users = [
    {
      id: 'user-001',
      username: 'admin',
      password_hash: 'password123',
      full_name: 'Nguyễn Hoàng Long',
      role: 'admin',
      branch_id: 'all',
      email: 'long.nh@freshmart.vn',
      phone: '0909 888 999',
      salary_basic: 35000000,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    },
    {
      id: 'user-002',
      username: 'manager_hcm',
      password_hash: 'password123',
      full_name: 'Trần Văn Nam',
      role: 'store_manager',
      branch_id: 'branch-hcm-01',
      email: 'nam.tv@freshmart.vn',
      phone: '0918 123 456',
      salary_basic: 18000000,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    },
    {
      id: 'user-003',
      username: 'kho_hcm',
      password_hash: 'password123',
      full_name: 'Phạm Quốc Huy',
      role: 'warehouse_manager',
      branch_id: 'branch-hcm-01',
      email: 'huy.pq@freshmart.vn',
      phone: '0933 654 321',
      salary_basic: 14000000,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    },
    {
      id: 'user-004',
      username: 'thungan_01',
      password_hash: 'password123',
      full_name: 'Lê Thị Thu Ngân',
      role: 'sales_staff',
      branch_id: 'branch-hcm-01',
      email: 'ngan.lt@freshmart.vn',
      phone: '0988 777 666',
      salary_basic: 9500000,
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    },
  ];

  for (const u of users) {
    await db.execute({
      sql: 'INSERT INTO users (id, username, password_hash, full_name, role, branch_id, email, phone, salary_basic, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [u.id, u.username, u.password_hash, u.full_name, u.role, u.branch_id, u.email, u.phone, u.salary_basic, u.avatar_url],
    });
  }

  // 3. Products
  const products = [
    {
      id: 'prod-001',
      barcode: '8936012340011',
      name: 'Rau Cải Bẹ Xanh VietGAP',
      category: 'vegetable',
      manufacturer: 'Nông Trại Hữu Cơ Đà Lạt',
      unit_size: 'Túi 500g',
      cost_price: 12000,
      selling_price: 18000,
      shelf_zone: 'Khu Rau Củ Tươi',
      shelf_aisle: 'Dãy R1',
      shelf_code: 'Kệ A1-01',
      storage_condition: '2°C - 8°C (Mát)',
      image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'prod-002',
      barcode: '8936012340028',
      name: 'Cà Chua Beef Đà Lạt Hạng 1',
      category: 'vegetable',
      manufacturer: 'Hợp Tác Xã Xuân Hương',
      unit_size: 'Hộp 500g',
      cost_price: 16000,
      selling_price: 26000,
      shelf_zone: 'Khu Rau Củ Tươi',
      shelf_aisle: 'Dãy R1',
      shelf_code: 'Kệ A1-02',
      storage_condition: 'Nhiệt độ phòng (18°C - 25°C)',
      image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'prod-003',
      barcode: '8936012340035',
      name: 'Nấm Đùi Gà Tươi BioVeg',
      category: 'vegetable',
      manufacturer: 'BioVeg Việt Nam',
      unit_size: 'Gói 300g',
      cost_price: 22000,
      selling_price: 32000,
      shelf_zone: 'Khu Rau Củ Tươi',
      shelf_aisle: 'Dãy R2',
      shelf_code: 'Kệ A2-01',
      storage_condition: '2°C - 5°C',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'prod-004',
      barcode: '8936012340042',
      name: 'Thịt Ba Rọi Heo Quế MeatDeli',
      category: 'meat_fish',
      manufacturer: 'Masan MeatDeli',
      unit_size: 'Khay 400g',
      cost_price: 68000,
      selling_price: 89000,
      shelf_zone: 'Tủ Thịt Mát Oxy-Fresh',
      shelf_aisle: 'Dãy T1',
      shelf_code: 'Tủ Mát T1-01',
      storage_condition: '0°C - 4°C (Thịt mát)',
      image_url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'prod-005',
      barcode: '8936012340059',
      name: 'Phi Lê Cá Hồi Tươi Nauy',
      category: 'meat_fish',
      manufacturer: 'Lerøy Seafood Norway',
      unit_size: 'Miếng 300g',
      cost_price: 135000,
      selling_price: 175000,
      shelf_zone: 'Quầy Hải Sản Tươi Sống',
      shelf_aisle: 'Dãy T2',
      shelf_code: 'Quầy Băng T2-01',
      storage_condition: '-2°C - 2°C (Ủ đá tuyết)',
      image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'prod-006',
      barcode: '8936012340066',
      name: 'Tôm Thẻ Chân Trắng Sạch Sinh Thái',
      category: 'meat_fish',
      manufacturer: 'Thủy Sản Minh Phú',
      unit_size: 'Hộp 500g',
      cost_price: 85000,
      selling_price: 115000,
      shelf_zone: 'Quầy Hải Sản Tươi Sống',
      shelf_aisle: 'Dãy T2',
      shelf_code: 'Quầy Băng T2-02',
      storage_condition: '0°C - 2°C',
      image_url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'prod-007',
      barcode: '8936012340073',
      name: 'Trứng Gà Ta Thảo Dược Ba Huân',
      category: 'dairy_egg',
      manufacturer: 'Ba Huân Food',
      unit_size: 'Vỉ 10 quả',
      cost_price: 28000,
      selling_price: 38000,
      shelf_zone: 'Khu Bơ Sữa & Trứng',
      shelf_aisle: 'Dãy B1',
      shelf_code: 'Kệ B1-01',
      storage_condition: '10°C - 15°C',
      image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'prod-008',
      barcode: '8936012340080',
      name: 'Sữa Tươi Thanh Trùng DalatMilk Không Đường',
      category: 'dairy_egg',
      manufacturer: 'DalatMilk',
      unit_size: 'Chai 950ml',
      cost_price: 36000,
      selling_price: 47000,
      shelf_zone: 'Tủ Mát Bơ Sữa',
      shelf_aisle: 'Dãy B2',
      shelf_code: 'Tủ Đứng B2-01',
      storage_condition: '2°C - 4°C',
      image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'prod-009',
      barcode: '8936012340097',
      name: 'Gạo Đặc Sản ST25 Thơm Thượng Hạng',
      category: 'dry_food',
      manufacturer: 'DNTN Hồ Quang Trí',
      unit_size: 'Túi 5kg',
      cost_price: 155000,
      selling_price: 195000,
      shelf_zone: 'Khu Gạo & Lương Thực',
      shelf_aisle: 'Dãy G1',
      shelf_code: 'Kệ G1-01',
      storage_condition: 'Khô ráo, thoáng mát',
      image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'prod-010',
      barcode: '8936012340103',
      name: 'Nước Ép Cam Tươi Nguyên Chất Vfresh',
      category: 'beverage',
      manufacturer: 'Vinamilk Vfresh',
      unit_size: 'Hộp 1L',
      cost_price: 35000,
      selling_price: 48000,
      shelf_zone: 'Khu Đồ Uống & Nước Giải Khát',
      shelf_aisle: 'Dãy N1',
      shelf_code: 'Kệ N1-01',
      storage_condition: 'Nhiệt độ phòng hoặc ngăn mát',
      image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'prod-011',
      barcode: '8936012340110',
      name: 'Dầu Ăn Hướng Dương Tự Nhiên Simply',
      category: 'spice_oil',
      manufacturer: 'Calofic Simply',
      unit_size: 'Chai 1L',
      cost_price: 52000,
      selling_price: 68000,
      shelf_zone: 'Khu Gia Vị & Dầu Ăn',
      shelf_aisle: 'Dãy V1',
      shelf_code: 'Kệ V1-01',
      storage_condition: 'Nhiệt độ phòng, tránh ánh nắng',
      image_url: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=400&q=80',
    },
  ];

  for (const p of products) {
    await db.execute({
      sql: `INSERT INTO products (id, barcode, name, category, manufacturer, unit_size, cost_price, selling_price, shelf_zone, shelf_aisle, shelf_code, storage_condition, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.id, p.barcode, p.name, p.category, p.manufacturer, p.unit_size, p.cost_price, p.selling_price, p.shelf_zone, p.shelf_aisle, p.shelf_code, p.storage_condition, p.image_url],
    });
  }

  // 4. Stock Batches (FEFO: early expiry, safe, and near expiry)
  const batches = [
    // Rau cải bẹ xanh: Lô sắp hết hạn và lô mới
    { id: 'batch-001', product_id: 'prod-001', branch_id: 'branch-hcm-01', batch_code: 'LOT-VEG-261001', quantity: 8, cost_price: 12000, expiry_date: '2026-10-06', received_at: '2026-10-01' },
    { id: 'batch-002', product_id: 'prod-001', branch_id: 'branch-hcm-01', batch_code: 'LOT-VEG-261003', quantity: 25, cost_price: 12000, expiry_date: '2026-10-09', received_at: '2026-10-03' },
    
    // Cà chua beef
    { id: 'batch-003', product_id: 'prod-002', branch_id: 'branch-hcm-01', batch_code: 'LOT-TOM-261002', quantity: 15, cost_price: 16000, expiry_date: '2026-10-10', received_at: '2026-10-02' },
    { id: 'batch-004', product_id: 'prod-002', branch_id: 'branch-hcm-01', batch_code: 'LOT-TOM-261004', quantity: 30, cost_price: 16000, expiry_date: '2026-10-16', received_at: '2026-10-04' },

    // Thịt heo MeatDeli
    { id: 'batch-005', product_id: 'prod-004', branch_id: 'branch-hcm-01', batch_code: 'LOT-PRK-261002', quantity: 12, cost_price: 68000, expiry_date: '2026-10-07', received_at: '2026-10-02' },
    { id: 'batch-006', product_id: 'prod-004', branch_id: 'branch-hcm-01', batch_code: 'LOT-PRK-261004', quantity: 20, cost_price: 68000, expiry_date: '2026-10-11', received_at: '2026-10-04' },

    // Cá hồi Nauy
    { id: 'batch-007', product_id: 'prod-005', branch_id: 'branch-hcm-01', batch_code: 'LOT-SLM-261003', quantity: 10, cost_price: 135000, expiry_date: '2026-10-08', received_at: '2026-10-03' },
    
    // Sữa thanh trùng
    { id: 'batch-008', product_id: 'prod-008', branch_id: 'branch-hcm-01', batch_code: 'LOT-MLK-261001', quantity: 14, cost_price: 36000, expiry_date: '2026-10-12', received_at: '2026-10-01' },
    
    // Gạo ST25 (Hạn xa)
    { id: 'batch-009', product_id: 'prod-009', branch_id: 'branch-hcm-01', batch_code: 'LOT-RCE-260915', quantity: 45, cost_price: 155000, expiry_date: '2027-03-15', received_at: '2026-09-15' },

    // Dầu ăn Simply (Hạn xa)
    { id: 'batch-010', product_id: 'prod-011', branch_id: 'branch-hcm-01', batch_code: 'LOT-OIL-260820', quantity: 50, cost_price: 52000, expiry_date: '2028-08-20', received_at: '2026-08-20' },
  ];

  for (const bt of batches) {
    await db.execute({
      sql: 'INSERT INTO stock_batches (id, product_id, branch_id, batch_code, quantity, cost_price, expiry_date, received_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [bt.id, bt.product_id, bt.branch_id, bt.batch_code, bt.quantity, bt.cost_price, bt.expiry_date, bt.received_at],
    });
  }

  // 5. Promotions
  const promotions = [
    {
      id: 'promo-01',
      code: 'FRESH10',
      name: 'Giảm 10% Cho Hóa Đơn Thực Phẩm Từ 150k',
      type: 'percentage',
      discount_value: 10,
      min_order_value: 150000,
      active: 1,
      description: 'Áp dụng cho mọi khách hàng mua sắm tại cửa hàng',
    },
    {
      id: 'promo-02',
      code: 'WEEKEND30K',
      name: 'Giảm 30.000đ Cho Đơn Hàng Cuối Tuần Từ 300k',
      type: 'fixed_amount',
      discount_value: 30000,
      min_order_value: 300000,
      active: 1,
      description: 'Giảm tiền mặt trực tiếp cho giỏ hàng trên 300.000 ₫',
    },
  ];

  for (const pr of promotions) {
    await db.execute({
      sql: 'INSERT INTO promotions (id, code, name, type, discount_value, min_order_value, active, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [pr.id, pr.code, pr.name, pr.type, pr.discount_value, pr.min_order_value, pr.active, pr.description],
    });
  }

  // 6. Customers
  const customers = [
    { id: 'cust-01', phone: '0901234567', name: 'Chị Mai Lan (VIP Diamond)', type: 'vip', debt_amount: 0, debt_limit: 10000000, loyalty_points: 1250 },
    { id: 'cust-02', phone: '0912345678', name: 'Anh Tuấn Kiệt (Khách Quen)', type: 'retail', debt_amount: 150000, debt_limit: 3000000, loyalty_points: 380 },
    { id: 'cust-03', phone: '0988776655', name: 'Nhà Hàng Bếp Xanh', type: 'wholesale', debt_amount: 2450000, debt_limit: 25000000, loyalty_points: 4890 },
  ];

  for (const c of customers) {
    await db.execute({
      sql: 'INSERT INTO customers (id, phone, name, type, debt_amount, debt_limit, loyalty_points) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [c.id, c.phone, c.name, c.type, c.debt_amount, c.debt_limit, c.loyalty_points],
    });
  }

  console.log('Database seeded successfully!');
}
