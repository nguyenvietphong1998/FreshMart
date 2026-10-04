import { Invoice, OutboxItem, Product, StockBatch, User } from '../types';
import { UserAccount } from '../data/usersData';

const TOKEN_KEY = 'freshmart_jwt_token';

class ApiClient {
  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public setToken(token: string | null) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    const token = this.getToken();

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Yêu cầu thất bại (${response.status})`);
    }

    return data as T;
  }

  // --- Auth & Profile ---
  async login(username: string, password: string) {
    const res = await this.request<{ success: boolean; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.getToken()) return null;
    try {
      return await this.request<User>('/api/auth/me');
    } catch (_e) {
      this.setToken(null);
      return null;
    }
  }

  logout() {
    this.setToken(null);
  }

  // --- Products ---
  async getProducts(branchId?: string): Promise<Product[]> {
    const url = branchId && branchId !== 'all' ? `/api/products?branchId=${encodeURIComponent(branchId)}` : '/api/products';
    return this.request<Product[]>(url);
  }

  async addProduct(product: Partial<Product>): Promise<{ success: boolean; product: Product }> {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(product: Product): Promise<{ success: boolean }> {
    return this.request(`/api/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/products/${id}`, { method: 'DELETE' });
  }

  // --- Batches ---
  async getBatches(branchId?: string): Promise<StockBatch[]> {
    const url = branchId && branchId !== 'all' ? `/api/batches?branchId=${encodeURIComponent(branchId)}` : '/api/batches';
    return this.request<StockBatch[]>(url);
  }

  async addNewBatch(batch: Omit<StockBatch, 'id'>): Promise<{ success: boolean; batch: StockBatch }> {
    return this.request('/api/batches', {
      method: 'POST',
      body: JSON.stringify(batch),
    });
  }

  async adjustBatch(id: string, newQuantity: number, reason: string): Promise<{ success: boolean }> {
    return this.request(`/api/batches/${id}/adjust`, {
      method: 'PATCH',
      body: JSON.stringify({ newQuantity, reason }),
    });
  }

  // --- Users (Admin only) ---
  async getUsers(): Promise<UserAccount[]> {
    return this.request<UserAccount[]>('/api/users');
  }

  async addUser(user: Omit<UserAccount, 'id'>): Promise<{ success: boolean; user: UserAccount }> {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(user: UserAccount): Promise<{ success: boolean; user: UserAccount }> {
    return this.request(`/api/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/users/${id}`, { method: 'DELETE' });
  }

  // --- Invoices ---
  async getInvoices(branchId?: string): Promise<Invoice[]> {
    const url = branchId && branchId !== 'all' ? `/api/invoices?branchId=${encodeURIComponent(branchId)}` : '/api/invoices';
    return this.request<Invoice[]>(url);
  }

  async createInvoice(invoiceData: any): Promise<{ success: boolean; invoiceId: string; code: string }> {
    return this.request('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  async cancelInvoice(id: string, reason: string): Promise<{ success: boolean }> {
    return this.request(`/api/invoices/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // --- Offline Batch Sync ---
  async syncOutbox(outboxItems: OutboxItem[]): Promise<{
    success: boolean;
    syncedCount: number;
    syncedIds: string[];
    conflicts: Array<{ clientId: string; code: string; reason: string }>;
  }> {
    return this.request('/api/sync/outbox', {
      method: 'POST',
      body: JSON.stringify({ outboxItems }),
    });
  }
}

export const apiClient = new ApiClient();
