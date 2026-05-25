/**
 * FuelFlow Pro — Database Seed Script
 * Run once after applying schema.sql to create the default admin user.
 *
 * Usage:
 *   cd packages/fuel-backend
 *   cp .env.example .env        (fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *   npx ts-node src/seed.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_USERS = [
  { name: 'System Admin',   email: 'admin@fuelflow.co.ke',     password: 'Admin@2024',     role: 'admin' },
  { name: 'Head Cashier',   email: 'cashier@fuelflow.co.ke',   password: 'Cashier@2024',   role: 'cashier' },
  { name: 'Accountant',     email: 'accounts@fuelflow.co.ke',  password: 'Accounts@2024',  role: 'accountant' },
];

const DEFAULT_SETTINGS: Record<string, string> = {
  business_name:        'FuelFlow Pro Station',
  business_phone:       '0712345678',
  business_email:       'info@fuelflow.co.ke',
  business_address:     'Nairobi, Kenya',
  mpesa_paybill:        '123456',
  credit_grace_days:    '30',
  sms_on_sale:          'true',
  sms_on_payment:       'true',
  low_stock_alerts:     'true',
  auto_reconcile:       'true',
};

const DEFAULT_PRODUCTS = [
  { name: 'Petrol (PMS)',   code: 'PMS', buying_price_per_litre: 135.00, selling_price_per_litre: 140.50, current_stock_litres: 8000, low_stock_alert_litres: 1000, colour: '#f59e0b' },
  { name: 'Diesel (AGO)',   code: 'AGO', buying_price_per_litre: 125.00, selling_price_per_litre: 130.00, current_stock_litres: 12000, low_stock_alert_litres: 2000, colour: '#10b981' },
  { name: 'Kerosene (IK)',  code: 'IK',  buying_price_per_litre: 95.00,  selling_price_per_litre: 100.00, current_stock_litres: 4000, low_stock_alert_litres: 500, colour: '#6366f1' },
];

async function seed() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   FuelFlow Pro — Database Seeder     ║');
  console.log('╚══════════════════════════════════════╝\n');

  // ── Users ──────────────────────────────────────
  console.log('📋 Creating default users...');
  for (const user of DEFAULT_USERS) {
    const { data: existing } = await supabase
      .from('fuel_users').select('id').eq('email', user.email).single();

    if (existing) {
      console.log(`  ✓ Skipping ${user.email} (already exists)`);
      continue;
    }

    const hash = await bcrypt.hash(user.password, 12);
    const { error } = await supabase.from('fuel_users').insert({
      name: user.name, email: user.email, password_hash: hash, role: user.role,
    });

    if (error) {
      console.error(`  ✗ Failed to create ${user.email}:`, error.message);
    } else {
      console.log(`  ✓ Created ${user.role}: ${user.email} / ${user.password}`);
    }
  }

  // ── Products ───────────────────────────────────
  console.log('\n⛽ Creating default fuel products...');
  for (const product of DEFAULT_PRODUCTS) {
    const { data: existing } = await supabase
      .from('fuel_products').select('id').eq('code', product.code).single();

    if (existing) {
      console.log(`  ✓ Skipping ${product.name} (already exists)`);
      continue;
    }

    const { error } = await supabase.from('fuel_products').insert(product);
    if (error) {
      console.error(`  ✗ Failed to create ${product.name}:`, error.message);
    } else {
      console.log(`  ✓ Created: ${product.name}`);
    }
  }

  // ── Settings ───────────────────────────────────
  console.log('\n⚙️  Applying default system settings...');
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await supabase.from('fuel_system_settings').upsert({ key, value }, { onConflict: 'key' });
  }
  console.log('  ✓ Settings applied');

  // ── Demo Customer ──────────────────────────────
  console.log('\n👤 Creating demo customer...');
  const { data: existingCust } = await supabase
    .from('fuel_customers').select('id').eq('phone', '0712000001').single();

  if (!existingCust) {
    const { error } = await supabase.from('fuel_customers').insert({
      name: 'Demo Customer',
      phone: '0712000001',
      company_name: 'ABC Transport Ltd',
      credit_limit: 100000,
      payment_preference: 'mpesa',
    });
    if (error) console.error('  ✗ Demo customer error:', error.message);
    else console.log('  ✓ Created demo customer: 0712000001');
  } else {
    console.log('  ✓ Demo customer already exists');
  }

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║              ✅ Seed Complete!                   ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  LOGIN CREDENTIALS                               ║');
  console.log('║  ─────────────────────────────────────────────  ║');
  console.log('║  Admin:      admin@fuelflow.co.ke / Admin@2024   ║');
  console.log('║  Cashier:    cashier@fuelflow.co.ke              ║');
  console.log('║              → Cashier@2024                      ║');
  console.log('║  Accountant: accounts@fuelflow.co.ke             ║');
  console.log('║              → Accounts@2024                     ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Change these passwords immediately after first login!\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
