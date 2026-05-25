-- ============================================================
-- FuelFlow Pro — Supabase PostgreSQL Schema
-- All tables prefixed with fuel_
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy search

-- ============================================================
-- SEQUENCES for human-readable numbers
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS fuel_customer_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS fuel_sale_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS fuel_payment_number_seq START 1;

-- ============================================================
-- fuel_users — System users (Admin, Cashier, Accountant)
-- ============================================================
CREATE TABLE fuel_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'cashier'
                  CHECK (role IN ('admin', 'cashier', 'accountant')),
  phone           VARCHAR(20),
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT true,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- fuel_customers — Fuel buyer customers
-- ============================================================
CREATE TABLE fuel_customers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code         VARCHAR(20) UNIQUE NOT NULL
                        DEFAULT ('FC' || LPAD(nextval('fuel_customer_code_seq')::TEXT, 4, '0')),
  name                  VARCHAR(255) NOT NULL,
  phone                 VARCHAR(20) NOT NULL,
  alt_phone             VARCHAR(20),
  email                 VARCHAR(255),
  company_name          VARCHAR(255),
  vehicle_plates        TEXT[],           -- array of plates
  id_number             VARCHAR(30),      -- national ID or KRA PIN
  credit_limit          DECIMAL(14,2) DEFAULT 0,
  current_balance       DECIMAL(14,2) DEFAULT 0,  -- positive = owes us money
  payment_preference    VARCHAR(30) DEFAULT 'mpesa'
                        CHECK (payment_preference IN ('mpesa','bank_transfer','pesalink','cash','mixed')),
  address               TEXT,
  notes                 TEXT,
  is_active             BOOLEAN DEFAULT true,
  created_by            UUID REFERENCES fuel_users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- fuel_products — Fuel types (Petrol, Diesel, Kerosene, etc.)
-- ============================================================
CREATE TABLE fuel_products (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      VARCHAR(100) NOT NULL,    -- Petrol, Diesel, Kerosene
  code                      VARCHAR(20) UNIQUE NOT NULL, -- PMS, AGO, KER
  unit                      VARCHAR(20) DEFAULT 'litres',
  buying_price_per_litre    DECIMAL(10,4) NOT NULL DEFAULT 0,
  selling_price_per_litre   DECIMAL(10,4) NOT NULL DEFAULT 0,
  current_stock_litres      DECIMAL(14,2) DEFAULT 0,
  low_stock_alert_litres    DECIMAL(14,2) DEFAULT 500,
  colour                    VARCHAR(7) DEFAULT '#10b981', -- hex color for UI
  is_active                 BOOLEAN DEFAULT true,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- fuel_sales — Sale transactions (pay now or pay later)
-- ============================================================
CREATE TABLE fuel_sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number     VARCHAR(20) UNIQUE NOT NULL
                  DEFAULT ('FS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('fuel_sale_number_seq')::TEXT, 5, '0')),
  customer_id     UUID NOT NULL REFERENCES fuel_customers(id),
  sale_date       TIMESTAMPTZ DEFAULT NOW(),
  subtotal        DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_amount    DECIMAL(14,2) NOT NULL DEFAULT 0,
  amount_paid     DECIMAL(14,2) NOT NULL DEFAULT 0,
  balance_due     DECIMAL(14,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  payment_status  VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (payment_status IN ('paid','partial','credit','pending','void')),
  payment_type    VARCHAR(20) NOT NULL DEFAULT 'pay_now'
                  CHECK (payment_type IN ('pay_now','pay_later')),
  notes           TEXT,
  voided_at       TIMESTAMPTZ,
  voided_by       UUID REFERENCES fuel_users(id),
  void_reason     TEXT,
  created_by      UUID REFERENCES fuel_users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- fuel_sale_items — Line items per sale
-- ============================================================
CREATE TABLE fuel_sale_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id           UUID NOT NULL REFERENCES fuel_sales(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES fuel_products(id),
  litres            DECIMAL(14,2) NOT NULL,
  price_per_litre   DECIMAL(10,4) NOT NULL,
  subtotal          DECIMAL(14,2) NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- fuel_payments — All incoming payment records
-- ============================================================
CREATE TABLE fuel_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number        VARCHAR(30) UNIQUE NOT NULL
                        DEFAULT ('FP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('fuel_payment_number_seq')::TEXT, 5, '0')),
  customer_id           UUID REFERENCES fuel_customers(id),  -- nullable until matched
  amount                DECIMAL(14,2) NOT NULL,
  payment_channel       VARCHAR(30) NOT NULL
                        CHECK (payment_channel IN (
                          'mpesa_stk','mpesa_c2b','pesalink',
                          'bank_transfer','bank_deposit','cash','intasend'
                        )),
  transaction_reference VARCHAR(200),  -- M-Pesa TransID, bank ref, etc.
  phone_number          VARCHAR(20),   -- sender phone
  payer_name            VARCHAR(255),  -- sender name from M-Pesa/bank
  payment_date          TIMESTAMPTZ DEFAULT NOW(),
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','failed','reconciled','unmatched')),
  auto_matched          BOOLEAN DEFAULT false,
  matched_at            TIMESTAMPTZ,
  matched_by            UUID REFERENCES fuel_users(id),
  notes                 TEXT,
  receipt_url           TEXT,          -- for bank deposit scans
  raw_webhook_payload   JSONB,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- fuel_payment_allocations — Map payments to specific sales
-- ============================================================
CREATE TABLE fuel_payment_allocations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id        UUID NOT NULL REFERENCES fuel_payments(id) ON DELETE CASCADE,
  sale_id           UUID NOT NULL REFERENCES fuel_sales(id),
  amount_allocated  DECIMAL(14,2) NOT NULL,
  allocated_by      UUID REFERENCES fuel_users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- fuel_credit_ledger — Running credit/debit ledger per customer
-- ============================================================
CREATE TABLE fuel_credit_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES fuel_customers(id),
  entry_type      VARCHAR(10) NOT NULL CHECK (entry_type IN ('debit','credit')),
  amount          DECIMAL(14,2) NOT NULL,
  running_balance DECIMAL(14,2) NOT NULL,  -- after this entry
  reference_type  VARCHAR(20) CHECK (reference_type IN ('sale','payment','adjustment')),
  reference_id    UUID,                    -- sale_id or payment_id
  reference_code  VARCHAR(50),             -- sale_number or payment_number
  description     TEXT,
  created_by      UUID REFERENCES fuel_users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- fuel_stock_deliveries — Fuel stock incoming deliveries
-- ============================================================
CREATE TABLE fuel_stock_deliveries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES fuel_products(id),
  delivery_date     TIMESTAMPTZ DEFAULT NOW(),
  litres_delivered  DECIMAL(14,2) NOT NULL,
  cost_per_litre    DECIMAL(10,4) NOT NULL,
  total_cost        DECIMAL(14,2) GENERATED ALWAYS AS (litres_delivered * cost_per_litre) STORED,
  supplier_name     VARCHAR(255),
  invoice_number    VARCHAR(100),
  vehicle_number    VARCHAR(50),         -- delivery truck
  notes             TEXT,
  created_by        UUID REFERENCES fuel_users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- fuel_webhook_logs — Raw webhook logs for debugging
-- ============================================================
CREATE TABLE fuel_webhook_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source              VARCHAR(30) NOT NULL CHECK (source IN ('daraja','intasend','manual','equity')),
  event_type          VARCHAR(100),
  raw_payload         JSONB NOT NULL,
  processed           BOOLEAN DEFAULT false,
  payment_id          UUID REFERENCES fuel_payments(id),
  processing_notes    TEXT,
  processing_error    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- fuel_bank_accounts — Dealer's bank accounts & Paybill info
-- ============================================================
CREATE TABLE fuel_bank_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name       VARCHAR(100) NOT NULL,        -- Equity Bank
  account_number  VARCHAR(30) NOT NULL,
  account_name    VARCHAR(255) NOT NULL,
  branch          VARCHAR(100),
  paybill_number  VARCHAR(20),                  -- M-Pesa Paybill
  till_number     VARCHAR(20),                  -- M-Pesa Till (Buy Goods)
  account_ref_hint TEXT,                        -- hint shown to customers
  is_primary      BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- fuel_system_settings — Key-value system configuration
-- ============================================================
CREATE TABLE fuel_system_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           VARCHAR(100) UNIQUE NOT NULL,
  value         TEXT,
  description   TEXT,
  updated_by    UUID REFERENCES fuel_users(id),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_fuel_customers_code   ON fuel_customers(customer_code);
CREATE INDEX idx_fuel_customers_phone  ON fuel_customers(phone);
CREATE INDEX idx_fuel_customers_name   ON fuel_customers USING gin(name gin_trgm_ops);
CREATE INDEX idx_fuel_sales_customer   ON fuel_sales(customer_id);
CREATE INDEX idx_fuel_sales_date       ON fuel_sales(sale_date DESC);
CREATE INDEX idx_fuel_sales_status     ON fuel_sales(payment_status);
CREATE INDEX idx_fuel_payments_customer ON fuel_payments(customer_id);
CREATE INDEX idx_fuel_payments_ref     ON fuel_payments(transaction_reference);
CREATE INDEX idx_fuel_payments_status  ON fuel_payments(status);
CREATE INDEX idx_fuel_payments_date    ON fuel_payments(payment_date DESC);
CREATE INDEX idx_fuel_payments_channel ON fuel_payments(payment_channel);
CREATE INDEX idx_fuel_credit_customer  ON fuel_credit_ledger(customer_id);
CREATE INDEX idx_fuel_credit_date      ON fuel_credit_ledger(created_at DESC);
CREATE INDEX idx_fuel_webhook_source   ON fuel_webhook_logs(source);
CREATE INDEX idx_fuel_webhook_processed ON fuel_webhook_logs(processed);
CREATE INDEX idx_fuel_webhook_date     ON fuel_webhook_logs(created_at DESC);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION fuel_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fuel_users_updated_at
  BEFORE UPDATE ON fuel_users
  FOR EACH ROW EXECUTE FUNCTION fuel_update_updated_at();

CREATE TRIGGER trg_fuel_customers_updated_at
  BEFORE UPDATE ON fuel_customers
  FOR EACH ROW EXECUTE FUNCTION fuel_update_updated_at();

CREATE TRIGGER trg_fuel_products_updated_at
  BEFORE UPDATE ON fuel_products
  FOR EACH ROW EXECUTE FUNCTION fuel_update_updated_at();

CREATE TRIGGER trg_fuel_sales_updated_at
  BEFORE UPDATE ON fuel_sales
  FOR EACH ROW EXECUTE FUNCTION fuel_update_updated_at();

CREATE TRIGGER trg_fuel_payments_updated_at
  BEFORE UPDATE ON fuel_payments
  FOR EACH ROW EXECUTE FUNCTION fuel_update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Backend uses service_role key
-- ============================================================
ALTER TABLE fuel_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_stock_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_system_settings ENABLE ROW LEVEL SECURITY;

-- Service role (backend) has full access to all tables
CREATE POLICY "service_role_all_fuel_users"        ON fuel_users        TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_fuel_customers"    ON fuel_customers    TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_fuel_products"     ON fuel_products     TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_fuel_sales"        ON fuel_sales        TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_fuel_sale_items"   ON fuel_sale_items   TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_fuel_payments"     ON fuel_payments     TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_fuel_allocations"  ON fuel_payment_allocations TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_fuel_ledger"       ON fuel_credit_ledger TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_fuel_stock"        ON fuel_stock_deliveries TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_fuel_webhooks"     ON fuel_webhook_logs TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_fuel_bank"         ON fuel_bank_accounts TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_fuel_settings"     ON fuel_system_settings TO service_role USING (true) WITH CHECK (true);

-- Enable Realtime on payments for live dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE fuel_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE fuel_sales;
ALTER PUBLICATION supabase_realtime ADD TABLE fuel_customers;

-- ============================================================
-- SEED DATA — Default settings and products
-- ============================================================
INSERT INTO fuel_system_settings (key, value, description) VALUES
  ('business_name', 'FuelFlow Pro', 'Dealer business name'),
  ('business_phone', '', 'Dealer phone number'),
  ('business_email', '', 'Dealer email'),
  ('business_address', '', 'Dealer physical address'),
  ('daraja_consumer_key', '', 'Safaricom Daraja API consumer key'),
  ('daraja_consumer_secret', '', 'Safaricom Daraja API consumer secret'),
  ('daraja_shortcode', '', 'M-Pesa Paybill shortcode'),
  ('daraja_passkey', '', 'M-Pesa STK Push passkey'),
  ('daraja_callback_url', '', 'Daraja callback base URL'),
  ('intasend_publishable_key', '', 'IntaSend publishable key'),
  ('intasend_secret_key', '', 'IntaSend secret API key'),
  ('intasend_is_sandbox', 'false', 'IntaSend sandbox mode'),
  ('africastalking_username', '', 'Africa''s Talking username'),
  ('africastalking_api_key', '', 'Africa''s Talking API key'),
  ('africastalking_sender_id', 'FUELFLOW', 'SMS sender ID'),
  ('sms_on_payment', 'true', 'Send SMS when payment received'),
  ('sms_on_sale', 'true', 'Send SMS when sale created'),
  ('low_stock_alerts', 'true', 'Enable low stock alerts'),
  ('credit_grace_days', '30', 'Days before credit is considered overdue');

INSERT INTO fuel_products (name, code, buying_price_per_litre, selling_price_per_litre, current_stock_litres, low_stock_alert_litres, colour) VALUES
  ('Petrol (Super)', 'PMS', 180.00, 195.00, 5000, 500, '#f59e0b'),
  ('Diesel', 'AGO', 170.00, 185.00, 8000, 800, '#10b981'),
  ('Kerosene', 'KER', 90.00, 110.00, 3000, 300, '#6366f1');
