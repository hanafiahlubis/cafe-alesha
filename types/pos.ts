export type CategoryType = 'Minuman' | 'Makanan Ringan' | 'Makanan Berat';
export type MenuStatus = 'Tersedia' | 'Habis';
export type PaymentMethod = 'Cash' | 'QRIS';

export interface MenuItem {
  id: string;
  name: string;
  category: CategoryType;
  price: number;
  hpp?: number;
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
  status?: 'COMPLETED' | 'CANCELLED';
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

export interface SavedOrder {
  id: string;
  orderName: string;
  items: CartItem[];
  totalPrice: number;
  createdAt: string;
  updatedAt?: string;
}

export type BalanceType = 'CASH' | 'QRIS';

export interface BalanceAdjustment {
  id: string;
  type: BalanceType;
  actualAmount: number;
  initialAmount?: number;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoreBalancesData {
  cash: BalanceAdjustment | null;
  qris: BalanceAdjustment | null;
  history?: BalanceAdjustment[];
}

export type ExpensePaymentMethod = 'CASH' | 'QRIS' | 'SPLIT';

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  paymentMethod?: ExpensePaymentMethod;
  cashAmount?: number;
  qrisAmount?: number;
  notes?: string | null;
  expenseDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeletedExpenseItem {
  id: string;
  expenseId?: string | null;
  title: string;
  amount: number;
  category: string;
  paymentMethod: ExpensePaymentMethod;
  cashAmount: number;
  qrisAmount: number;
  notes?: string | null;
  expenseDate: string;
  deletedAt: string;
}
