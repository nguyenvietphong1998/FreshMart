# Kế Hoạch Triển Khai: Kiến Trúc Backend Cho FreshMart RMS

Xây dựng hệ thống Backend hoàn chỉnh chạy trên Node.js Express kết hợp cơ sở dữ liệu SQLite nội bộ, cung cấp toàn bộ RESTful API nghiệp vụ cho chuỗi cửa hàng thực phẩm, xác thực JWT phân quyền 4 vai trò (RBAC), kiểm soát xuất kho theo lô FEFO và cổng đồng bộ hóa đơn ngoại tuyến (Offline Outbox Batch Sync) an toàn, chống xung đột tồn kho.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Toàn bộ các quyết định then chốt đã được bạn xác nhận và là kim chỉ nam cho thiết kế kiến trúc Backend:

- **Cơ sở dữ liệu Backend**: Sử dụng SQLite lưu trữ dữ liệu tập trung (`data/rms.db` hoặc in-memory sqlite/better-sqlite3) đảm bảo tính toàn vẹn ACID, truy vấn quan hệ chuẩn SQL, dễ dàng sao lưu, không phụ thuộc dịch vụ ngoài và chạy trơn tru ngay trong môi trường dev & container.
- **Cơ chế Đồng bộ Ngoại Tuyến (Offline Sync Engine)**: Xây dựng endpoint `/api/sync/outbox` dạng Batch Sync xử lý đồng thời nhiều hóa đơn từ hàng đợi Outbox của POS. Sử dụng khóa bất biến `clientId` (UUID) để đảm bảo tính **Idempotent** (chống trùng đơn khi gửi lại nhiều lần), đồng thời đối chiếu tồn kho theo lô FEFO để gắn cờ `stock_conflict: true` và cảnh báo nếu số lượng thực tế đã bị lệch.
- **Xác thực & Bảo mật (JWT Auth & RBAC)**: Triển khai luồng đăng nhập `/api/auth/login`, phát hành JWT Access Token có đính kèm `userId`, `username`, `role` và `branchId`. Middleware `authenticateToken` và `requireRole(['admin', ...])` bảo vệ nghiêm ngặt các tuyến API quản lý người dùng, điều chỉnh kho và cấu hình chi nhánh.

---

## 1. Overview & Core Concept

- **Mục tiêu**: Nâng cấp ứng dụng từ client-side state sang mô hình full-stack production-grade: Frontend React Vite tích hợp máy chủ Express API server, chạy chung trên cổng 3000 thông qua `vite.middlewares`.
- **Phạm vi nghiệp vụ Backend**:
  - *Quản lý Định danh & Người dùng (Auth & Users)*: Đăng nhập cấp JWT, mã hóa mật khẩu, phân bổ chi nhánh, CRUD người dùng chỉ dành cho Admin.
  - *Quản lý Danh mục & Sản phẩm (Products & Catalog)*: Tìm kiếm mã vạch EAN-13, tra cứu giá, cấu hình vị trí kệ hàng và lưu trữ ảnh đại diện sản phẩm.
  - *Động cơ Kho & Lô hàng FEFO (Inventory Batches)*: Nhập kho theo lô, tự động sắp xếp theo hạn sử dụng tăng dần, tự động tính toán trừ kho theo nguyên tắc cận hạn xuất trước, cảnh báo 3 mức độ (An toàn, Cận hạn <7 ngày, Quá hạn).
  - *Giao dịch Bán hàng & Hóa đơn (POS Transactions & Invoices)*: Tạo hóa đơn thanh toán, trừ tồn kho tức thì, in lại bill nhiệt 80mm, hủy hóa đơn hoàn kho FEFO.
  - *Hàng đợi Đồng bộ Ngoại tuyến (Offline Outbox Sync)*: Tiếp nhận các giao dịch phát sinh khi quầy thu ngân bị mất mạng, kiểm tra trùng lặp và ghi nhận vào sổ cái doanh thu.
  - *Báo cáo & Phân tích (Analytics & Reports)*: Thống kê doanh thu theo chi nhánh, ca làm việc, tỷ suất lợi nhuận và cảnh báo tồn kho.

---

## 2. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER (VITE SPA)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  POS Module  │  │  Inventory   │  │ Users Module │  │ IndexedDB/ │  │
│  │  (Cart/Scan) │  │  (FEFO Batch)│  │ (Admin RBAC) │  │ Outbox Q   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
└─────────┼─────────────────┼─────────────────┼────────────────┼─────────┘
          │ (REST API with Bearer JWT Token)   │                │
          ▼                 ▼                 ▼                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   EXPRESS API BACKEND (server.ts)                      │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Middleware: CORS · JSON Body · Auth Guard (JWT) · Role Validator │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                   │                                    │
│       ┌───────────────────────────┼───────────────────────────┐        │
│       ▼                           ▼                           ▼        │
│  ┌───────────────┐        ┌───────────────┐        ┌───────────────┐   │
│  │ /api/auth     │        │ /api/products │        │ /api/sync     │   │
│  │ /api/users    │        │ /api/batches  │        │ (Batch Sync   │   │
│  │ (Admin Guard) │        │ /api/invoices │        │  Idempotency) │   │
│  └───────┬───────┘        └───────┬───────┘        └───────┬───────┘   │
└──────────┼────────────────────────┼────────────────────────┼───────────┘
           ▼                        ▼                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PERSISTENCE LAYER (SQLite Database)                  │
│                                                                        │
│  • users (id, username, password_hash, role, branch_id, avatar_url)    │
│  • branches (id, code, name, address, phone, manager)                  │
│  • products (id, barcode, name, category, cost, price, shelf, image)   │
│  • stock_batches (id, product_id, branch_id, batch_code, qty, expiry) │
│  • invoices (id, code, client_id, branch_id, cashier, total, status)   │
│  • invoice_items (id, invoice_id, product_id, qty, price, discount)    │
│  • promotions (id, code, name, type, discount_value, min_order)        │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Schema (SQLite Tables)

1. **`users`**:
   - `id` (TEXT PRIMARY KEY), `username` (TEXT UNIQUE), `password_hash` (TEXT), `full_name` (TEXT), `role` (TEXT CHECK: admin, store_manager, warehouse_manager, sales_staff), `branch_id` (TEXT), `email` (TEXT), `phone` (TEXT), `salary_basic` (INTEGER), `status` (TEXT CHECK: active, inactive), `avatar_url` (TEXT), `created_at` (DATETIME).
2. **`branches`**:
   - `id` (TEXT PRIMARY KEY), `code` (TEXT UNIQUE), `name` (TEXT), `address` (TEXT), `phone` (TEXT), `lat` (REAL), `lng` (REAL), `manager_name` (TEXT).
3. **`products`**:
   - `id` (TEXT PRIMARY KEY), `barcode` (TEXT UNIQUE), `name` (TEXT), `category` (TEXT), `manufacturer` (TEXT), `unit_size` (TEXT), `cost_price` (INTEGER), `selling_price` (INTEGER), `shelf_zone` (TEXT), `shelf_aisle` (TEXT), `shelf_code` (TEXT), `storage_condition` (TEXT), `image_url` (TEXT).
4. **`stock_batches`**:
   - `id` (TEXT PRIMARY KEY), `product_id` (TEXT REFERENCES products), `branch_id` (TEXT REFERENCES branches), `batch_code` (TEXT), `quantity` (INTEGER), `cost_price` (INTEGER), `expiry_date` (TEXT ISO8601), `received_at` (TEXT).
5. **`invoices`**:
   - `id` (TEXT PRIMARY KEY), `code` (TEXT UNIQUE), `client_id` (TEXT UNIQUE for Idempotency), `branch_id` (TEXT), `cashier_id` (TEXT), `cashier_name` (TEXT), `customer_name` (TEXT), `customer_phone` (TEXT), `subtotal` (INTEGER), `discount_total` (INTEGER), `final_total` (INTEGER), `payment_method` (TEXT), `status` (TEXT CHECK: completed, cancelled), `cancel_reason` (TEXT), `is_offline_sync` (BOOLEAN), `stock_conflict` (BOOLEAN), `created_at` (DATETIME).
6. **`invoice_items`**:
   - `id` (TEXT PRIMARY KEY), `invoice_id` (TEXT REFERENCES invoices), `product_id` (TEXT), `product_name` (TEXT), `barcode` (TEXT), `quantity` (INTEGER), `unit_price` (INTEGER), `discount` (INTEGER), `total` (INTEGER).
7. **`invoice_batch_allocations`**:
   - `id` (TEXT PRIMARY KEY), `invoice_item_id` (TEXT), `batch_id` (TEXT), `quantity` (INTEGER).

---

## 3. Core API Endpoints Specification

### Authentication & Users (`/api/auth`, `/api/users`)
- `POST /api/auth/login`: Xác thực username & password, trả về JWT token và thông tin người dùng.
- `GET /api/auth/me`: Kiểm tra phiên đăng nhập và quyền hạn hiện tại từ JWT.
- `GET /api/users`: [Admin only] Lấy danh sách toàn bộ người dùng, tìm kiếm và lọc theo chi nhánh/vai trò.
- `POST /api/users`: [Admin only] Tạo tài khoản người dùng mới (có chọn avatar, phân quyền, mật khẩu).
- `PUT /api/users/:id`: [Admin or Self for profile] Cập nhật thông tin hồ sơ, đổi mật khẩu, đổi avatar.
- `DELETE /api/users/:id`: [Admin only] Xóa tài khoản nhân viên (ngăn xóa chính mình và admin cuối cùng).

### Products & Inventory (`/api/products`, `/api/batches`)
- `GET /api/products`: Lấy danh mục sản phẩm kèm tổng số tồn kho tính gộp từ các lô còn hạn.
- `POST /api/products`: Thêm sản phẩm mới (có hỗ trợ upload ảnh base64 hoặc URL).
- `PUT /api/products/:id`: Cập nhật giá, quy cách, vị trí kệ hàng hoặc ảnh sản phẩm.
- `GET /api/batches`: Lấy danh sách lô hàng theo chi nhánh, hỗ trợ lọc theo cận hạn (<7 ngày) hoặc quá hạn.
- `POST /api/batches`: Nhập lô hàng mới (ghi nhận mã lô, số lượng, giá vốn, ngày hết hạn).
- `PATCH /api/batches/:id/adjust`: Điều chỉnh số lượng tồn kho (kiểm kê, hư hỏng, tiêu hủy hàng hết hạn).

### POS & Offline Synchronization (`/api/invoices`, `/api/sync`)
- `POST /api/invoices`: Tạo đơn hàng trực tiếp online, tự động phân bổ trừ kho theo thuật toán FEFO trong Transaction SQL.
- `GET /api/invoices`: Tra cứu lịch sử hóa đơn theo ngày, ca, chi nhánh, thu ngân.
- `POST /api/invoices/:id/cancel`: Hủy hóa đơn bán hàng, hoàn trả số lượng lại vào các lô kho tương ứng.
- `POST /api/sync/outbox`: Tiếp nhận mảng `{ outboxItems: OutboxItem[] }`.
  - Kiểm tra `client_id`: Nếu đã tồn tại thì bỏ qua (Idempotent response).
  - Phân bổ trừ kho FEFO cho từng hóa đơn.
  - Nếu số lượng tồn kho của một mặt hàng không đủ (do đã bị bán ở phiên khác), đơn hàng vẫn được lưu nhận doanh thu nhưng gắn cờ `stock_conflict: true` để thủ kho kiểm tra điều chỉnh.
  - Phản hồi danh sách các ID hóa đơn đã đồng bộ thành công để client xóa khỏi Outbox.

### Reports & Dashboard (`/api/reports`)
- `GET /api/reports/summary`: Tổng doanh thu hôm nay, lợi nhuận gộp tạm tính, tổng số giao dịch, cảnh báo lô hàng hết hạn.
- `GET /api/reports/sales-by-branch`: So sánh hiệu quả kinh doanh giữa các chi nhánh.

---

## 4. Implementation Steps & Milestones

1. **Khởi tạo Database SQLite & Seeding (`server/db.ts`)**:
   - Sử dụng thư viện SQLite chuẩn không cần cài đặt binary phức tạp (như `better-sqlite3` hoặc SQLite module với driver ổn định).
   - Tự động chạy Migration tạo các bảng quan hệ nếu chưa tồn tại.
   - Seed dữ liệu ban đầu phong phú: Chi nhánh, 4 tài khoản người dùng tương ứng 4 vai trò, 20+ thực phẩm sạch Việt Nam, các lô hàng FEFO với ngày hết hạn thực tế.
2. **Xây dựng Server Express & Middleware (`server.ts`)**:
   - Cấu hình Express middleware (`cors`, `express.json({ limit: '10mb' })` hỗ trợ ảnh avatar & sản phẩm).
   - Middleware `jwtAuth` mã hóa và kiểm tra token.
   - Tích hợp Vite development middleware (`vite.middlewares`) theo quy chuẩn Full-Stack AI Studio.
3. **Hiện thực hóa Toàn Bộ Router API**:
   - `authRouter.ts` & `usersRouter.ts` (kiểm tra quyền Admin).
   - `productsRouter.ts` & `batchesRouter.ts` (thuật toán FEFO SQL transaction).
   - `invoicesRouter.ts` & `syncRouter.ts` (Idempotent Batch Sync).
   - `reportsRouter.ts` (truy vấn SQL thống kê nhóm theo thời gian và chi nhánh).
4. **Kết Nối Frontend với Backend API**:
   - Cập nhật `storageService.ts` hoặc `apiClient.ts` trong frontend để ưu tiên gọi Backend API khi ở chế độ Online.
   - Khi ở chế độ Offline (mô phỏng hoặc mất mạng thực tế), frontend chuyển sang lưu IndexedDB/LocalStorage và đẩy vào Outbox.
   - Khi mạng phục hồi, tự động kích hoạt `POST /api/sync/outbox` để đồng bộ toàn bộ đơn hàng tồn đọng.
5. **Cấu hình `package.json` & Kiểm tra Build**:
   - Cập nhật scripts `"dev": "tsx server.ts"` và `"start": "node server.js"`.
   - Kiểm tra biên dịch hoàn tất (`compile_applet`, `lint_applet`) và chạy thử nghiệm luồng toàn diện.
