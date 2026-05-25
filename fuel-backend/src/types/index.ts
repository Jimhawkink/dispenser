// ============================================================
// FuelFlow Pro — TypeScript Types & Interfaces
// ============================================================

export type UserRole = 'admin' | 'cashier' | 'accountant';
export type PaymentChannel = 'mpesa_stk' | 'mpesa_c2b' | 'pesalink' | 'bank_transfer' | 'bank_deposit' | 'cash' | 'intasend';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'reconciled' | 'unmatched';
export type SaleStatus = 'paid' | 'partial' | 'credit' | 'pending' | 'void';
export type PaymentType = 'pay_now' | 'pay_later';
export type EntryType = 'debit' | 'credit';

export interface FuelUser {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface FuelCustomer {
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
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FuelProduct {
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
  created_at: string;
  updated_at: string;
}

export interface FuelSale {
  id: string;
  sale_number: string;
  customer_id: string;
  customer?: FuelCustomer;
  sale_date: string;
  subtotal: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_status: SaleStatus;
  payment_type: PaymentType;
  notes?: string;
  voided_at?: string;
  voided_by?: string;
  void_reason?: string;
  items?: FuelSaleItem[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FuelSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product?: FuelProduct;
  litres: number;
  price_per_litre: number;
  subtotal: number;
  created_at: string;
}

export interface FuelPayment {
  id: string;
  payment_number: string;
  customer_id?: string;
  customer?: FuelCustomer;
  amount: number;
  payment_channel: PaymentChannel;
  transaction_reference?: string;
  phone_number?: string;
  payer_name?: string;
  payment_date: string;
  status: PaymentStatus;
  auto_matched: boolean;
  matched_at?: string;
  matched_by?: string;
  notes?: string;
  receipt_url?: string;
  raw_webhook_payload?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FuelPaymentAllocation {
  id: string;
  payment_id: string;
  sale_id: string;
  amount_allocated: number;
  allocated_by?: string;
  created_at: string;
}

export interface FuelCreditLedger {
  id: string;
  customer_id: string;
  entry_type: EntryType;
  amount: number;
  running_balance: number;
  reference_type?: string;
  reference_id?: string;
  reference_code?: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

export interface FuelStockDelivery {
  id: string;
  product_id: string;
  product?: FuelProduct;
  delivery_date: string;
  litres_delivered: number;
  cost_per_litre: number;
  total_cost: number;
  supplier_name?: string;
  invoice_number?: string;
  vehicle_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface FuelWebhookLog {
  id: string;
  source: string;
  event_type?: string;
  raw_payload: Record<string, unknown>;
  processed: boolean;
  payment_id?: string;
  processing_notes?: string;
  processing_error?: string;
  created_at: string;
}

export interface FuelBankAccount {
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
  created_at: string;
}

export interface FuelSystemSetting {
  id: string;
  key: string;
  value?: string;
  description?: string;
  updated_by?: string;
  updated_at: string;
}

// Request extensions
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        name: string;
      };
    }
  }
}

// Daraja API types
export interface DarajaC2BPayload {
  TransactionType: string;
  TransID: string;
  TransTime: string;
  TransAmount: string;
  BusinessShortCode: string;
  BillRefNumber: string;
  InvoiceNumber?: string;
  OrgAccountBalance?: string;
  ThirdPartyTransID?: string;
  MSISDN: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
}

export interface DarajaSTKCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>;
      };
    };
  };
}

// IntaSend webhook types
export interface IntaSendWebhookPayload {
  invoice_id: string;
  state: string;
  provider: string;
  charges: string;
  net_amount: string;
  currency: string;
  value: string;
  account: string;
  api_ref?: string;
  mpesa_reference?: string;
  host: string;
  card_info?: Record<string, unknown>;
  customer: {
    id: string;
    phone_number: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
