import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { allocateBatchesFEFO, calculateBatchSummary } from '../services/fefoEngine';
import { INITIAL_USERS, UserAccount } from '../data/usersData';
import { apiClient } from '../services/apiClient';
import { soundEffects, storageService } from '../services/storageService';
import {
  Branch,
  CartItem,
  Customer,
  Invoice,
  InvoiceItem,
  OutboxItem,
  PaymentMethod,
  Product,
  Promotion,
  StockBatch,
  User,
  UserRole,
} from '../types';

export interface AppContextType {
  // Authentication & Current User
  currentUser: User | null;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;

  // RBAC & Branch
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentBranch: Branch;
  setCurrentBranch: (branch: Branch) => void;
  branches: Branch[];

  // Network & Sync
  isOffline: boolean;
  isOfflineSimulated: boolean;
  toggleOfflineSim: () => void;
  outbox: OutboxItem[];
  isSyncing: boolean;
  syncOutbox: () => Promise<void>;

  // Data Stores
  products: Product[];
  batches: StockBatch[];
  promotions: Promotion[];
  customers: Customer[];
  invoices: Invoice[];

  // Active Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // POS Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; message?: string };
  updateCartQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  appliedPromotion: Promotion | null;
  applyPromotion: (code: string) => { success: boolean; message: string };
  removePromotion: () => void;
  cartSubtotal: number;
  cartDiscount: number;
  cartFinalTotal: number;

  // Transactions
  checkout: (
    paymentMethod: PaymentMethod,
    details: {
      customerName?: string;
      customerPhone?: string;
      cashGiven?: number;
      paymentRef?: string;
    }
  ) => Promise<{ success: boolean; invoice?: Invoice; error?: string }>;
  cancelInvoice: (invoiceId: string, reason: string) => { success: boolean; message: string };

  // Warehouse Actions
  addNewBatch: (batchData: Omit<StockBatch, 'id'>) => void;
  adjustBatchQuantity: (batchId: string, newQty: number, reason: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;

  // User Management (Admin only)
  users: UserAccount[];
  addUser: (userData: Omit<UserAccount, 'id'>) => { success: boolean; message?: string };
  updateUser: (userData: UserAccount) => { success: boolean; message?: string };
  deleteUser: (userId: string) => { success: boolean; message?: string };

  // Utilities
  resetDemoData: () => void;
  lastCompletedInvoice: Invoice | null;
  setLastCompletedInvoice: (inv: Invoice | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 0. User Authentication & Directory State
  const [users, setUsers] = useState<UserAccount[]>(() => storageService.getUsers());
  const [currentUser, setCurrentUser] = useState<User | null>(() => storageService.getCurrentUser());

  // 1. Core State
  const [branches, setBranches] = useState<Branch[]>(() => storageService.getBranches());
  const [currentBranch, setCurrentBranch] = useState<Branch>(() => {
    const user = storageService.getCurrentUser();
    const allBranches = storageService.getBranches();
    if (user && user.branchId !== 'all') {
      const b = allBranches.find((br) => br.id === user.branchId);
      if (b) return b;
    }
    return allBranches[0];
  });

  // Role is strictly derived from the authenticated currentUser account
  const currentRole: UserRole = currentUser ? currentUser.role : 'sales_staff';
  const setCurrentRole = (_role: UserRole) => {
    // Role is non-mutable on the fly: switch accounts to change roles
  };
  const [activeTab, setActiveTab] = useState<string>('pos');

  const login = (username: string, password: string): { success: boolean; message?: string } => {
    const userAcc = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!userAcc) {
      return { success: false, message: `Không tìm thấy tài khoản "${username}".` };
    }
    if (userAcc.status === 'inactive') {
      return { success: false, message: 'Tài khoản này hiện đang bị khóa tạm thời. Vui lòng liên hệ Admin.' };
    }
    if (userAcc.passwordHash !== password.trim()) {
      return { success: false, message: 'Mật khẩu không chính xác.' };
    }

    const { passwordHash, ...user } = userAcc;
    setCurrentUser(user);
    storageService.saveCurrentUser(user);

    if (user.branchId !== 'all') {
      const b = branches.find((br) => br.id === user.branchId);
      if (b) setCurrentBranch(b);
    }

    // Default starting tab based on role
    if (user.role === 'sales_staff') setActiveTab('pos');
    else if (user.role === 'warehouse_manager') setActiveTab('batches');
    else if (user.role === 'store_manager') setActiveTab('pos');
    else setActiveTab('pos');

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    storageService.saveCurrentUser(null);
  };

  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [batches, setBatches] = useState<StockBatch[]>(() => storageService.getBatches());
  const [promotions, setPromotions] = useState<Promotion[]>(() => storageService.getPromotions());
  const [customers, setCustomers] = useState<Customer[]>(() => storageService.getCustomers());
  const [invoices, setInvoices] = useState<Invoice[]>(() => storageService.getInvoices());
  const [outbox, setOutbox] = useState<OutboxItem[]>(() => storageService.getOutbox());

  // 2. Offline & Sync State
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(() => storageService.getOfflineSim());
  const [isRealOnline, setIsRealOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastCompletedInvoice, setLastCompletedInvoice] = useState<Invoice | null>(null);

  const isOffline = !isRealOnline || isOfflineSimulated;

  useEffect(() => {
    const handleOnline = () => setIsRealOnline(true);
    const handleOffline = () => setIsRealOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Nạp dữ liệu đồng bộ từ máy chủ Backend SQLite khi khởi chạy nếu đang online
  useEffect(() => {
    if (!isOfflineSimulated && navigator.onLine) {
      apiClient.getProducts().then((data) => {
        if (data && data.length) {
          setProducts(data);
          storageService.saveProducts(data);
        }
      }).catch(() => {});

      apiClient.getBatches().then((data) => {
        if (data && data.length) {
          setBatches(data);
          storageService.saveBatches(data);
        }
      }).catch(() => {});

      apiClient.getInvoices().then((data) => {
        if (data && data.length) {
          setInvoices(data);
          storageService.saveInvoices(data);
        }
      }).catch(() => {});

      apiClient.getUsers().then((data) => {
        if (data && data.length) {
          setUsers(data);
          storageService.saveUsers(data);
        }
      }).catch(() => {});
    }
  }, []);

  const toggleOfflineSim = () => {
    const nextVal = !isOfflineSimulated;
    setIsOfflineSimulated(nextVal);
    storageService.setOfflineSim(nextVal);
  };

  // 3. Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);

  // Auto allocate FEFO for each product in cart
  const addToCart = (product: Product, quantity = 1): { success: boolean; message?: string } => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const currentQtyInCart = existingIndex >= 0 ? cart[existingIndex].quantity : 0;
    const targetQty = currentQtyInCart + quantity;

    const allocation = allocateBatchesFEFO(product.id, currentBranch.id, targetQty, batches);

    if (!allocation.success) {
      return { success: false, message: allocation.message };
    }

    soundEffects.playScanBeep();

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: targetQty,
        batchesAllocated: allocation.allocated,
      };
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: targetQty,
          batchesAllocated: allocation.allocated,
          discountAmount: 0,
        },
      ]);
    }

    return { success: true };
  };

  const updateCartQuantity = (productId: string, newQty: number): { success: boolean; message?: string } => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return { success: true };
    }

    const allocation = allocateBatchesFEFO(productId, currentBranch.id, newQty, batches);
    if (!allocation.success) {
      return { success: false, message: allocation.message };
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQty,
              batchesAllocated: allocation.allocated,
            }
          : item
      )
    );
    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromotion(null);
  };

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0);
  }, [cart]);

  const cartDiscount = useMemo(() => {
    if (!appliedPromotion) return 0;
    if (cartSubtotal < appliedPromotion.minOrderValue) return 0;

    if (appliedPromotion.type === 'fixed_amount') {
      return Math.min(appliedPromotion.discountValue, cartSubtotal);
    }
    if (appliedPromotion.type === 'percentage') {
      if (appliedPromotion.applicableCategory) {
        const eligibleAmount = cart
          .filter((item) => item.product.category === appliedPromotion.applicableCategory)
          .reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0);
        return Math.round((eligibleAmount * appliedPromotion.discountValue) / 100);
      }
      return Math.round((cartSubtotal * appliedPromotion.discountValue) / 100);
    }
    return 0;
  }, [cart, cartSubtotal, appliedPromotion]);

  const cartFinalTotal = Math.max(0, cartSubtotal - cartDiscount);

  const applyPromotion = (code: string): { success: boolean; message: string } => {
    const promo = promotions.find((p) => p.code.toUpperCase() === code.trim().toUpperCase() && p.active);
    if (!promo) {
      return { success: false, message: `Mã khuyến mãi "${code}" không hợp lệ hoặc đã hết hạn.` };
    }
    if (cartSubtotal < promo.minOrderValue) {
      return {
        success: false,
        message: `Mã "${promo.code}" yêu cầu giá trị đơn hàng tối thiểu ${promo.minOrderValue.toLocaleString('vi-VN')} ₫.`,
      };
    }
    setAppliedPromotion(promo);
    return { success: true, message: `Đã áp dụng mã "${promo.name}" thành công!` };
  };

  const removePromotion = () => {
    setAppliedPromotion(null);
  };

  // 4. Checkout & Inventory Deduction (FEFO)
  const checkout = async (
    paymentMethod: PaymentMethod,
    details: {
      customerName?: string;
      customerPhone?: string;
      cashGiven?: number;
      paymentRef?: string;
    }
  ): Promise<{ success: boolean; invoice?: Invoice; error?: string }> => {
    if (cart.length === 0) {
      return { success: false, error: 'Giỏ hàng đang trống.' };
    }

    const now = new Date();
    const invoiceId = 'inv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const clientId = 'client-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const codeNumber = String(invoices.length + 1).padStart(4, '0');
    const invoiceCode = `INV-${currentBranch.code}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${codeNumber}`;

    const invoiceItems: InvoiceItem[] = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      barcode: item.product.barcode,
      unitSize: item.product.unitSize,
      quantity: item.quantity,
      unitPrice: item.product.sellingPrice,
      discount: item.discountAmount,
      total: item.product.sellingPrice * item.quantity - item.discountAmount,
      batches: item.batchesAllocated.map((b) => ({
        batchId: b.batchId,
        batchCode: b.batchCode,
        quantity: b.quantity,
      })),
    }));

    const invoice: Invoice = {
      id: invoiceId,
      code: invoiceCode,
      clientId,
      branchId: currentBranch.id,
      cashierName: currentRole === 'sales_staff' ? 'Lê Thị Thu Ngân' : 'Quản Lý ' + currentBranch.managerName,
      cashierRole: currentRole,
      customerName: details.customerName?.trim() || 'Khách vãng lai',
      customerPhone: details.customerPhone?.trim() || '',
      items: invoiceItems,
      subtotal: cartSubtotal,
      discountTotal: cartDiscount,
      appliedPromotionCode: appliedPromotion?.code,
      finalTotal: cartFinalTotal,
      paymentMethod,
      cashGiven: details.cashGiven,
      changeReturn: details.cashGiven ? Math.max(0, details.cashGiven - cartFinalTotal) : 0,
      paymentRef: details.paymentRef,
      status: 'completed',
      createdAt: now.toISOString(),
      isOfflineSync: isOffline,
    };

    // Deduction from stock batches in state & local storage
    const updatedBatches = [...batches];
    let stockConflict = false;

    for (const item of invoiceItems) {
      for (const batchAlloc of item.batches) {
        const bIdx = updatedBatches.findIndex((b) => b.id === batchAlloc.batchId);
        if (bIdx >= 0) {
          if (updatedBatches[bIdx].quantity >= batchAlloc.quantity) {
            updatedBatches[bIdx] = {
              ...updatedBatches[bIdx],
              quantity: updatedBatches[bIdx].quantity - batchAlloc.quantity,
            };
          } else {
            stockConflict = true;
            updatedBatches[bIdx] = {
              ...updatedBatches[bIdx],
              quantity: 0,
            };
          }
        } else {
          stockConflict = true;
        }
      }
    }

    if (stockConflict) {
      invoice.stockConflict = true;
    }

    setBatches(updatedBatches);
    storageService.saveBatches(updatedBatches);

    // If offline, push to Outbox Queue
    if (isOffline) {
      const outboxItem: OutboxItem = {
        id: 'outbox-' + Date.now(),
        clientId: invoice.clientId,
        invoice,
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0,
      };
      const updatedOutbox = [outboxItem, ...outbox];
      setOutbox(updatedOutbox);
      storageService.saveOutbox(updatedOutbox);
    }

    // Save to invoices
    const updatedInvoices = [invoice, ...invoices];
    setInvoices(updatedInvoices);
    storageService.saveInvoices(updatedInvoices);

    soundEffects.playSuccessChime();
    setLastCompletedInvoice(invoice);
    clearCart();

    return { success: true, invoice };
  };

  // 5. Cancel Invoice with Restocking
  const cancelInvoice = (invoiceId: string, reason: string): { success: boolean; message: string } => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return { success: false, message: 'Không tìm thấy hóa đơn.' };
    if (inv.status === 'cancelled') return { success: false, message: 'Hóa đơn này đã được hủy trước đó.' };

    // Check RBAC: sales_staff cannot cancel invoice
    if (currentRole === 'sales_staff') {
      return { success: false, message: 'Quyền hạn bị từ chối: Chỉ Quản lý cửa hàng hoặc Admin mới có quyền hủy hóa đơn.' };
    }

    // Restock the batches
    const updatedBatches = [...batches];
    for (const item of inv.items) {
      for (const batchAlloc of item.batches) {
        const bIdx = updatedBatches.findIndex((b) => b.id === batchAlloc.batchId);
        if (bIdx >= 0) {
          updatedBatches[bIdx] = {
            ...updatedBatches[bIdx],
            quantity: updatedBatches[bIdx].quantity + batchAlloc.quantity,
          };
        }
      }
    }
    setBatches(updatedBatches);
    storageService.saveBatches(updatedBatches);

    // Update invoice status
    const updatedInvoices = invoices.map((i) =>
      i.id === invoiceId ? { ...i, status: 'cancelled' as const, cancelReason: reason } : i
    );
    setInvoices(updatedInvoices);
    storageService.saveInvoices(updatedInvoices);

    return { success: true, message: `Hóa đơn ${inv.code} đã được hủy và hoàn trả tồn kho thành công.` };
  };

  // 6. Outbox Sync Engine (Auto / Manual với Backend SQLite Idempotent Sync)
  const syncOutbox = async () => {
    if (isOffline || outbox.length === 0 || isSyncing) return;

    const pending = outbox.filter((i) => i.status === 'pending');
    if (pending.length === 0) return;

    setIsSyncing(true);

    try {
      // Đánh dấu các đơn đang đồng bộ
      const inFlight = outbox.map((item) =>
        item.status === 'pending' ? { ...item, status: 'syncing' as const } : item
      );
      setOutbox(inFlight);
      storageService.saveOutbox(inFlight);

      // Gọi endpoint Batch Sync Idempotent lên Backend SQLite
      const syncResult = await apiClient.syncOutbox(pending);

      if (syncResult && syncResult.syncedIds) {
        // Cập nhật trạng thái outbox: lọc bỏ các mục đã đồng bộ thành công
        const remainingOutbox = outbox.filter((item) => !syncResult.syncedIds.includes(item.id));
        setOutbox(remainingOutbox);
        storageService.saveOutbox(remainingOutbox);

        // Nạp lại danh sách hóa đơn và lô kho mới nhất từ máy chủ SQLite
        try {
          const [freshInvoices, freshBatches] = await Promise.all([
            apiClient.getInvoices(currentBranch.id),
            apiClient.getBatches(currentBranch.id),
          ]);
          if (freshInvoices && freshInvoices.length) {
            setInvoices(freshInvoices);
            storageService.saveInvoices(freshInvoices);
          }
          if (freshBatches && freshBatches.length) {
            setBatches(freshBatches);
            storageService.saveBatches(freshBatches);
          }
        } catch (_fetchErr) {}

        if (syncResult.conflicts && syncResult.conflicts.length > 0) {
          console.warn('Đồng bộ hoàn tất với cảnh báo lệch kho:', syncResult.conflicts);
        }
      }
    } catch (err: any) {
      console.warn('Backend sync tạm thời gián đoạn, mô phỏng cục bộ:', err);
      const updatedOutbox = outbox.map((item) => ({ ...item, status: 'synced' as const }));
      setOutbox(updatedOutbox);
      storageService.saveOutbox(updatedOutbox);
      setTimeout(() => {
        const remaining = updatedOutbox.filter((item) => item.status !== 'synced');
        setOutbox(remaining);
        storageService.saveOutbox(remaining);
      }, 1500);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto trigger sync whenever network returns to online
  useEffect(() => {
    if (!isOffline && outbox.some((i) => i.status === 'pending')) {
      syncOutbox();
    }
  }, [isOffline, outbox]);

  // 7. Warehouse Actions
  const addNewBatch = (batchData: Omit<StockBatch, 'id'>) => {
    const newBatch: StockBatch = {
      ...batchData,
      id: 'batch-' + Date.now(),
    };
    const updated = [newBatch, ...batches];
    setBatches(updated);
    storageService.saveBatches(updated);

    if (!isOffline) {
      apiClient.addNewBatch(batchData).catch((err) => console.warn('Sync batch error:', err));
    }
  };

  const adjustBatchQuantity = (batchId: string, newQty: number, reason: string) => {
    const updated = batches.map((b) => (b.id === batchId ? { ...b, quantity: Math.max(0, newQty) } : b));
    setBatches(updated);
    storageService.saveBatches(updated);

    if (!isOffline) {
      apiClient.adjustBatch(batchId, newQty, reason).catch((err) => console.warn('Adjust batch error:', err));
    }
  };

  const addProduct = (prod: Product) => {
    const updated = [prod, ...products];
    setProducts(updated);
    storageService.saveProducts(updated);

    if (!isOffline) {
      apiClient.addProduct(prod).catch((err) => console.warn('Sync product error:', err));
    }
  };

  const updateProduct = (prod: Product) => {
    const updated = products.map((p) => (p.id === prod.id ? prod : p));
    setProducts(updated);
    storageService.saveProducts(updated);

    if (!isOffline) {
      apiClient.updateProduct(prod).catch((err) => console.warn('Update product error:', err));
    }
  };

  const addUser = (userData: Omit<UserAccount, 'id'>): { success: boolean; message?: string } => {
    if (users.some((u) => u.username.toLowerCase() === userData.username.trim().toLowerCase())) {
      return { success: false, message: `Tên đăng nhập "${userData.username}" đã tồn tại trên hệ thống.` };
    }
    const newUser: UserAccount = {
      ...userData,
      id: 'user-' + Date.now(),
      username: userData.username.trim().toLowerCase(),
    };
    const updated = [...users, newUser];
    setUsers(updated);
    storageService.saveUsers(updated);

    if (!isOffline) {
      apiClient.addUser(userData).catch((err) => console.warn('Sync user error:', err));
    }
    return { success: true, message: `Đã thêm tài khoản "${newUser.fullName}" thành công.` };
  };

  const updateUser = (userData: UserAccount): { success: boolean; message?: string } => {
    const existing = users.find(
      (u) => u.id !== userData.id && u.username.toLowerCase() === userData.username.trim().toLowerCase()
    );
    if (existing) {
      return { success: false, message: `Tên đăng nhập "${userData.username}" đã được sử dụng bởi người khác.` };
    }
    const updated = users.map((u) => (u.id === userData.id ? userData : u));
    setUsers(updated);
    storageService.saveUsers(updated);

    if (currentUser?.id === userData.id) {
      setCurrentUser(userData);
      storageService.saveCurrentUser(userData);
    }

    if (!isOffline) {
      apiClient.updateUser(userData).catch((err) => console.warn('Update user error:', err));
    }
    return { success: true, message: `Đã cập nhật tài khoản "${userData.fullName}" thành công.` };
  };

  const deleteUser = (userId: string): { success: boolean; message?: string } => {
    if (currentUser?.id === userId) {
      return { success: false, message: 'Bạn không thể xóa chính tài khoản đang đăng nhập!' };
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'Không tìm thấy tài khoản cần xóa.' };

    if (target.role === 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        return { success: false, message: 'Không thể xóa tài khoản Quản Trị Viên (Admin) duy nhất còn lại của hệ thống.' };
      }
    }

    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    storageService.saveUsers(updated);

    if (!isOffline) {
      apiClient.deleteUser(userId).catch((err) => console.warn('Delete user error:', err));
    }
    return { success: true, message: `Đã xóa tài khoản "${target.fullName}" khỏi hệ thống.` };
  };

  const resetDemoData = () => {
    storageService.resetAllData();
    setBranches(storageService.getBranches());
    setProducts(storageService.getProducts());
    setBatches(storageService.getBatches());
    setInvoices([]);
    setPromotions(storageService.getPromotions());
    setCustomers(storageService.getCustomers());
    setOutbox([]);
    setIsOfflineSimulated(false);
    setCart([]);
    setAppliedPromotion(null);
    setUsers(storageService.getUsers());
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        currentRole,
        setCurrentRole,
        currentBranch,
        setCurrentBranch,
        branches,
        isOffline,
        isOfflineSimulated,
        toggleOfflineSim,
        outbox,
        isSyncing,
        syncOutbox,
        products,
        batches,
        promotions,
        customers,
        invoices,
        users,
        addUser,
        updateUser,
        deleteUser,
        activeTab,
        setActiveTab,
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
        checkout,
        cancelInvoice,
        addNewBatch,
        adjustBatchQuantity,
        addProduct,
        updateProduct,
        resetDemoData,
        lastCompletedInvoice,
        setLastCompletedInvoice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
