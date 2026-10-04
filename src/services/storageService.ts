import {
  INITIAL_BRANCHES,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_PROMOTIONS,
  INITIAL_STOCK_BATCHES,
} from '../data/seedData';
import { INITIAL_USERS, UserAccount } from '../data/usersData';
import { Branch, Customer, Invoice, OutboxItem, Product, Promotion, StockBatch, User } from '../types';

const STORAGE_KEYS = {
  BRANCHES: 'rms_food_branches_v1',
  PRODUCTS: 'rms_food_products_v1',
  BATCHES: 'rms_food_batches_v1',
  INVOICES: 'rms_food_invoices_v1',
  PROMOTIONS: 'rms_food_promotions_v1',
  CUSTOMERS: 'rms_food_customers_v1',
  OUTBOX: 'rms_food_outbox_v1',
  OFFLINE_SIM: 'rms_food_offline_sim_v1',
  CURRENT_USER: 'rms_food_current_user_v1',
  USERS_LIST: 'rms_food_users_list_v1',
};

// Khởi tạo bộ dữ liệu Local/IndexedDB bền vững
export function getInitialData<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(stored) as T;
  } catch (e) {
    console.error(`Error loading ${key} from storage:`, e);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

// Data loaders
export const storageService = {
  getBranches: (): Branch[] => getInitialData(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES),
  saveBranches: (branches: Branch[]) => saveToStorage(STORAGE_KEYS.BRANCHES, branches),

  getProducts: (): Product[] => getInitialData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),
  saveProducts: (products: Product[]) => saveToStorage(STORAGE_KEYS.PRODUCTS, products),

  getBatches: (): StockBatch[] => getInitialData(STORAGE_KEYS.BATCHES, INITIAL_STOCK_BATCHES),
  saveBatches: (batches: StockBatch[]) => saveToStorage(STORAGE_KEYS.BATCHES, batches),

  getInvoices: (): Invoice[] => getInitialData(STORAGE_KEYS.INVOICES, []),
  saveInvoices: (invoices: Invoice[]) => saveToStorage(STORAGE_KEYS.INVOICES, invoices),

  getPromotions: (): Promotion[] => getInitialData(STORAGE_KEYS.PROMOTIONS, INITIAL_PROMOTIONS),
  savePromotions: (promos: Promotion[]) => saveToStorage(STORAGE_KEYS.PROMOTIONS, promos),

  getCustomers: (): Customer[] => getInitialData(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS),
  saveCustomers: (customers: Customer[]) => saveToStorage(STORAGE_KEYS.CUSTOMERS, customers),

  getOutbox: (): OutboxItem[] => getInitialData(STORAGE_KEYS.OUTBOX, []),
  saveOutbox: (outbox: OutboxItem[]) => saveToStorage(STORAGE_KEYS.OUTBOX, outbox),

  getOfflineSim: (): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEYS.OFFLINE_SIM) === 'true';
    } catch {
      return false;
    }
  },
  setOfflineSim: (val: boolean) => {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_SIM, String(val));
  },

  getCurrentUser: (): User | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!stored) return INITIAL_USERS[0]; // Mặc định đăng nhập tài khoản Admin mẫu
      return JSON.parse(stored) as User;
    } catch {
      return INITIAL_USERS[0];
    }
  },
  saveCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getUsers: (): UserAccount[] => getInitialData(STORAGE_KEYS.USERS_LIST, INITIAL_USERS),
  saveUsers: (users: UserAccount[]) => saveToStorage(STORAGE_KEYS.USERS_LIST, users),

  resetAllData: () => {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(INITIAL_BRANCHES));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(INITIAL_STOCK_BATCHES));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(INITIAL_PROMOTIONS));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.OFFLINE_SIM, 'false');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(INITIAL_USERS));
  },
};

// Web Audio API Sound Effects (Barcode scan 'beep' and Payment 'chime')
class SoundEffects {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playScanBeep() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, this.ctx.currentTime); // High pleasant beep (A6)
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio might be muted by browser policy, ignore safely
    }
  }

  playSuccessChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const now = this.ctx.currentTime;
      // Arpeggio chime: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.1, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch {
      // ignore
    }
  }
}

export const soundEffects = new SoundEffects();
