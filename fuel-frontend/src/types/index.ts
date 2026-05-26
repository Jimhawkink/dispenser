// ============================================================
// FuelFlow Pro — Frontend TypeScript Types
// ============================================================

export type UserRole = 'admin' | 'cashier' | 'accountant';
export type PaymentChannel = 'mpesa_stk' | 'mpesa_c2b' | 'pesalink' | 'bank_transfer' | 'bank_deposit' | 'cash' | 'intasend';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'reconciled' | 'unmatched';
export type SaleStatus = 'paid' | 'partial' | 'credit' | 'pending' | 'void';
export type PaymentType = 'pay_now' | 'pay_later';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  phone: string;
  alt_phone?: string;
  email?: string;
  company_name?: string;
  vehicle_plates?: string[];
  id_number?: string;
  credit_limit: number;
  current_balance: number;
  payment_preference: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  buying_price_per_litre: number;
  selling_price_per_litre: number;
  current_stock_litres: number;
  low_stock_alert_litres: number;
  colour: string;
  is_active: boolean;
}

export interface SaleItem {
  id?: string;
  product_id: string;
  product?: Product;
  litres: number;
  price_per_litre: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  sale_number: string;
  customer_id: string;
  customer?: Customer;
  sale_date: string;
  subtotal: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_status: SaleStatus;
  payment_type: PaymentType;
  notes?: string;
  items?: SaleItem[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  payment_number: string;
  customer_id?: string;
  customer?: Customer;
  amount: number;
  payment_channel: PaymentChannel;
  transaction_reference?: string;
  phone_number?: string;
  payer_name?: string;
  payment_date: string;
  status: PaymentStatus;
  auto_matched: boolean;
  matched_at?: string;
  notes?: string;
  receipt_url?: string;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  customer_id: string;
  entry_type: 'debit' | 'credit';
  amount: number;
  running_balance: number;
  reference_type?: string;
  reference_code?: string;
  description?: string;
  created_at: string;
}

export interface StockDelivery {
  id: string;
  product_id: string;
  product?: Product;
  delivery_date: string;
  litres_delivered: number;
  cost_per_litre: number;
  total_cost: number;
  supplier_name?: string;
  invoice_number?: string;
  vehicle_number?: string;
  notes?: string;
  created_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  branch?: string;
  paybill_number?: string;
  till_number?: string;
  account_ref_hint?: string;
  is_primary: boolean;
  is_active: boolean;
}

export interface DashboardStats {
  today_sales: number;
  today_collections: number;
  total_outstanding: number;
  unmatched_payments: number;
  low_stock_products: Product[];
  payment_channels: { channel: string; amount: number; count: number }[];
  top_debtors: Customer[];
  weekly_chart: { date: string; revenue: number; credit: number }[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: Pagination;
}

// Channel label helpers
export const CHANNEL_LABELS: Record<PaymentChannel, string> = {
  mpesa_stk: 'M-Pesa STK',
  mpesa_c2b: 'M-Pesa Paybill',
  pesalink: 'PesaLink',
  bank_transfer: 'Bank Transfer',
  bank_deposit: 'Bank Deposit',
  cash: 'Cash',
  intasend: 'IntaSend',
};

export const CHANNEL_COLORS: Record<PaymentChannel, string> = {
  mpesa_stk: '#10b981',
  mpesa_c2b: '#10b981',
  pesalink: '#8b5cf6',
  bank_transfer: '#3b82f6',
  bank_deposit: '#ef4444',
  cash: '#f59e0b',
  intasend: '#06b6d4',
};

export const STATUS_COLORS: Record<SaleStatus | PaymentStatus, { bg: string; text: string; dot: string }> = {
  paid:       { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  reconciled: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  confirmed:  { bg: 'bg-blue-500/15',    text: 'text-blue-400',    dot: 'bg-blue-400' },
  partial:    { bg: 'bg-blue-500/15',    text: 'text-blue-400',    dot: 'bg-blue-400' },
  credit:     { bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  pending:    { bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  unmatched:  { bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400' },
  failed:     { bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400' },
  void:       { bg: 'bg-gray-500/15',    text: 'text-slate-500',    dot: 'bg-gray-400' },
};

// KES currency formatter
export const formatKES = (amount: number): string =>
  `KES ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatLitres = (l: number): string =>
  `${Number(l || 0).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}L`;

