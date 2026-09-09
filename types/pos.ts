export type CategoryType = 'Minuman' | 'Makanan Ringan' | 'Makanan Berat';
export type MenuStatus = 'Tersedia' | 'Habis';
export type PaymentMethod = 'Cash' | 'QRIS';

export interface MenuItem {
  id: string;
  name: string;
  category: CategoryType;
  price: number;
  description: string;
  status: MenuStatus;
  image?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Transaction {
  id: string;
  queueNumber: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeAmount?: number;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
}

export interface DailyRecap {
  date: string;
  totalRevenue: number;
  totalTransactions: number;
  totalCash: number;
  totalQris: number;
  countCash: number;
  countQris: number;
}

export interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  qrisNmid: string;
  qrisMerchantName: string;
}
