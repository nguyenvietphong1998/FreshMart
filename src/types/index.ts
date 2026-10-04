export type UserRole = 'admin' | 'store_manager' | 'warehouse_manager' | 'sales_staff';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  branchId: string; // 'all' hoặc ID chi nhánh cụ thể
  avatarUrl: string;
  phone?: string;
  status: 'active' | 'inactive';
  salaryBasic?: number;
  passwordHash?: string;
}

export interface RoleConfig {
  role: UserRole;
  title: string;
  badgeColor: string;
  description: string;
  allowedFeatures: string[];
}

export type FoodCategory =
  | 'vegetable'
  | 'meat_fish'
  | 'dairy_egg'
  | 'dry_food'
  | 'beverage'
  | 'spice_oil';

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  openingHours: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  managerName: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: FoodCategory;
  manufacturer: string;
  unitSize: string;
  costPrice: number;
  sellingPrice: number;
  shelfLocation: {
    zone: string;
    aisle: string;
    shelf: string;
  };
  storageCondition: string;
  minStockThreshold: number;
  imageUrl?: string;
}

export interface StockBatch {
  id: string;
  productId: string;
  branchId: string;
  batchCode: string;
  quantity: number;
  costPrice: number;
  expiryDate: string; // YYYY-MM-DD
  receivedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  batchesAllocated: {
    batchId: string;
    batchCode: string;
    quantity: number;
    expiryDate: string;
    daysUntilExpiry: number;
  }[];
  discountAmount: number;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed_amount' | 'combo';
  discountValue: number;
  minOrderValue: number;
  applicableCategory?: FoodCategory;
  applicableProductId?: string;
  active: boolean;
  description: string;
}

export type PaymentMethod = 'cash' | 'vietqr' | 'momo' | 'vnpay';

export interface InvoiceItem {
  productId: string;
  productName: string;
  barcode: string;
  unitSize: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  batches: {
    batchId: string;
    batchCode: string;
    quantity: number;
  }[];
}

export interface Invoice {
  id: string;
  code: string;
  clientId: string; // UUID for offline idempotent sync
  branchId: string;
  cashierName: string;
  cashierRole: UserRole;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  appliedPromotionCode?: string;
  finalTotal: number;
  paymentMethod: PaymentMethod;
  cashGiven?: number;
  changeReturn?: number;
  paymentRef?: string;
  status: 'completed' | 'cancelled';
  cancelReason?: string;
  createdAt: string;
  isOfflineSync: boolean;
  stockConflict?: boolean;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  type: 'retail' | 'wholesale' | 'vip';
  debtAmount: number;
  debtLimit: number;
  loyaltyPoints: number;
}

export interface OutboxItem {
  id: string;
  clientId: string;
  invoice: Invoice;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  error?: string;
}
