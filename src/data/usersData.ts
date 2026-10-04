import { User } from '../types';

export interface UserAccount extends User {
  passwordHash: string; // Plain/hashed for demo verification
}

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-001',
    username: 'admin',
    passwordHash: 'password123',
    fullName: 'Nguyễn Hoàng Long',
    email: 'long.nh@freshmart.vn',
    role: 'admin',
    branchId: 'all',
    phone: '0909 888 999',
    status: 'active',
    salaryBasic: 35000000,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'user-002',
    username: 'manager_hcm',
    passwordHash: 'password123',
    fullName: 'Trần Văn Nam',
    email: 'nam.tv@freshmart.vn',
    role: 'store_manager',
    branchId: 'branch-hcm-01',
    phone: '0918 123 456',
    status: 'active',
    salaryBasic: 18000000,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'user-003',
    username: 'kho_hcm',
    passwordHash: 'password123',
    fullName: 'Phạm Quốc Huy',
    email: 'huy.pq@freshmart.vn',
    role: 'warehouse_manager',
    branchId: 'branch-hcm-01',
    phone: '0933 654 321',
    status: 'active',
    salaryBasic: 14000000,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'user-004',
    username: 'thungan_01',
    passwordHash: 'password123',
    fullName: 'Lê Thị Thu Ngân',
    email: 'ngan.lt@freshmart.vn',
    role: 'sales_staff',
    branchId: 'branch-hcm-01',
    phone: '0988 777 666',
    status: 'active',
    salaryBasic: 9500000,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  },
];

export const USER_AVATAR_PRESETS = [
  { label: 'Nữ 1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80' },
  { label: 'Nam 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80' },
  { label: 'Nữ 2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80' },
  { label: 'Nam 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80' },
  { label: 'Nam 3', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80' },
  { label: 'Nữ 3', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80' },
  { label: 'Nam 4', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80' },
  { label: 'Nữ 4', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80' },
  { label: 'Nam 5', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80' },
  { label: 'Nữ 5', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80' },
  { label: 'Nam 6', url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=250&q=80' },
  { label: 'Nam 7', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80' },
];
