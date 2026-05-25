import supabase from '../config/supabase';
import { addCreditEntry } from './ledger.service';
import { sendPaymentReceivedSMS } from './sms.service';
import { DarajaC2BPayload, IntaSendWebhookPayload } from '../types';

/**
 * Core auto-matching engine.
 * Tries to match an incoming payment to a customer via:
 * 1. BillRefNumber / account field → customer_code
 * 2. phone_number → customer phone
 * Then auto-allocates to oldest outstanding sales.
 */
export async function reconcilePayment(paymentId: string): Promise<{ matched: boolean; customerId?: string }> {
  const { data: payment } = await supabase
    .from('fuel_payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (!payment) return { matched: false };

  let customerId: string | null = null;

  // --- Step 1: Match by transaction_reference (customer_code in BillRefNumber) ---
  if (payment.transaction_reference) {
    const ref = payment.transaction_reference.trim().toUpperCase();
    const { data: byCode } = await supabase
      .from('fuel_customers')
      .select('id, name, phone, current_balance')
      .ilike('customer_code', ref)
      .eq('is_active', true)
      .single();
    if (byCode) customerId = byCode.id;
  }

  // --- Step 2: Match by phone number ---
  if (!customerId && payment.phone_number) {
    const phone = normalizePhone(payment.phone_number);
    const { data: byPhone } = await supabase
      .from('fuel_customers')
      .select('id, name, phone, current_balance')
      .or(`phone.eq.${phone},phone.eq.${payment.phone_number},alt_phone.eq.${phone}`)
      .eq('is_active', true)
      .single();
    if (byPhone) customerId = byPhone.id;
  }

  if (!customerId) {
    // Mark as unmatched for manual review
    await supabase
      .from('fuel_payments')
      .update({ status: 'unmatched', updated_at: new Date().toISOString() })
      .eq('id', paymentId);
    console.log(`[Reconciliation] Payment ${paymentId} UNMATCHED — needs manual review`);
    return { matched: false };
  }

  // --- Matched! Get customer details ---
  const { data: customer } = await supabase
    .from('fuel_customers')
    .select('id, name, phone, current_balance')
    .eq('id', customerId)
    .single();

  if (!customer) return { matched: false };

  // --- Update payment record ---
  await supabase.from('fuel_payments').update({
    customer_id: customerId,
    status: 'reconciled',
    auto_matched: true,
    matched_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', paymentId);

  // --- Credit the ledger ---
  const newBalance = await addCreditEntry(
    customerId,
    payment.amount,
    'payment',
    paymentId,
    payment.payment_number,
    `Payment via ${payment.payment_channel} - Ref: ${payment.transaction_reference || 'N/A'}`,
  );

  // --- Auto-allocate to oldest outstanding sales ---
  await autoAllocateToSales(paymentId, customerId, payment.amount);

  // --- Send SMS confirmation ---
  const smsEnabled = await getSystemSetting('sms_on_payment');
  if (smsEnabled === 'true' && customer.phone) {
    await sendPaymentReceivedSMS(
      customer.name,
      customer.phone,
      payment.amount,
      payment.transaction_reference || payment.payment_number,
      newBalance
    );
  }

  console.log(`[Reconciliation] Payment ${paymentId} matched to customer ${customer.name} (${customerId})`);
  return { matched: true, customerId };
}

async function autoAllocateToSales(paymentId: string, customerId: string, totalAmount: number): Promise<void> {
  // Get oldest unpaid / partial sales for this customer
  const { data: sales } = await supabase
    .from('fuel_sales')
    .select('id, sale_number, total_amount, amount_paid, balance_due')
    .eq('customer_id', customerId)
    .in('payment_status', ['pending', 'partial', 'credit'])
    .order('sale_date', { ascending: true })
    .limit(20);

  if (!sales || sales.length === 0) return;

  let remaining = totalAmount;

  for (const sale of sales) {
    if (remaining <= 0) break;
    const allocate = Math.min(remaining, sale.balance_due);
    if (allocate <= 0) continue;

    // Insert allocation
    await supabase.from('fuel_payment_allocations').insert({
      payment_id: paymentId,
      sale_id: sale.id,
      amount_allocated: allocate,
    });

    const newAmountPaid = sale.amount_paid + allocate;
    const newStatus = newAmountPaid >= sale.total_amount ? 'paid' : 'partial';

    // Update sale
    await supabase.from('fuel_sales').update({
      amount_paid: newAmountPaid,
      payment_status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', sale.id);

    remaining -= allocate;
  }
}

/** Process Daraja C2B confirmation payload */
export async function processDarajaC2B(payload: DarajaC2BPayload): Promise<string> {
  const { data: existing } = await supabase
    .from('fuel_payments')
    .select('id')
    .eq('transaction_reference', payload.TransID)
    .single();

  if (existing) {
    console.log(`[Daraja C2B] Duplicate TransID ${payload.TransID}, skipping`);
    return existing.id;
  }

  const payer = [payload.FirstName, payload.MiddleName, payload.LastName].filter(Boolean).join(' ');
  const phone = normalizePhone(payload.MSISDN);

  const { data: inserted } = await supabase.from('fuel_payments').insert({
    amount: parseFloat(payload.TransAmount),
    payment_channel: 'mpesa_c2b',
    transaction_reference: payload.TransID,
    phone_number: phone,
    payer_name: payer || null,
    payment_date: parseDarajaTime(payload.TransTime),
    status: 'pending',
    auto_matched: false,
    raw_webhook_payload: payload as unknown as Record<string, unknown>,
  }).select('id').single();

  if (inserted) {
    await reconcilePayment(inserted.id);
    return inserted.id;
  }
  throw new Error('Failed to insert C2B payment');
}

/** Process Daraja STK Push callback */
export async function processDarajaSTKCallback(payload: Record<string, unknown>): Promise<void> {
  const callback = (payload as { Body: { stkCallback: Record<string, unknown> } }).Body?.stkCallback;
  if (!callback || callback.ResultCode !== 0) {
    console.log('[Daraja STK] Failed/cancelled payment:', callback?.ResultDesc);
    return;
  }

  const items: Array<{ Name: string; Value?: string | number }> =
    (callback.CallbackMetadata as { Item: Array<{ Name: string; Value?: string | number }> })?.Item || [];

  const get = (name: string) => items.find(i => i.Name === name)?.Value;
  const amount = parseFloat((get('Amount') || '0').toString());
  const mpesaRef = (get('MpesaReceiptNumber') || '').toString();
  const phone = (get('PhoneNumber') || '').toString();

  if (!mpesaRef) return;

  const { data: existing } = await supabase
    .from('fuel_payments')
    .select('id')
    .eq('transaction_reference', mpesaRef)
    .single();

  if (existing) return;

  const { data: inserted } = await supabase.from('fuel_payments').insert({
    amount,
    payment_channel: 'mpesa_stk',
    transaction_reference: mpesaRef,
    phone_number: normalizePhone(phone),
    payment_date: new Date().toISOString(),
    status: 'pending',
    auto_matched: false,
    raw_webhook_payload: payload,
  }).select('id').single();

  if (inserted) await reconcilePayment(inserted.id);
}

/** Process IntaSend webhook */
export async function processIntaSendWebhook(payload: IntaSendWebhookPayload): Promise<void> {
  if (payload.state !== 'COMPLETE') return;

  const ref = payload.mpesa_reference || payload.invoice_id;
  const { data: existing } = await supabase
    .from('fuel_payments')
    .select('id')
    .eq('transaction_reference', ref)
    .single();

  if (existing) return;

  const amount = parseFloat(payload.net_amount || payload.value || '0');
  const phone = normalizePhone(payload.customer?.phone_number || '');
  const payer = [payload.customer?.first_name, payload.customer?.last_name].filter(Boolean).join(' ');
  const channel = detectIntaSendChannel(payload.provider);

  const { data: inserted } = await supabase.from('fuel_payments').insert({
    amount,
    payment_channel: channel,
    transaction_reference: ref,
    phone_number: phone,
    payer_name: payer || null,
    payment_date: new Date().toISOString(),
    status: 'pending',
    auto_matched: false,
    raw_webhook_payload: payload as unknown as Record<string, unknown>,
  }).select('id').single();

  if (inserted) await reconcilePayment(inserted.id);
}

// ---- Helpers ----
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('254')) return `0${cleaned.slice(3)}`;
  if (cleaned.startsWith('0')) return cleaned;
  return cleaned;
}

function parseDarajaTime(timeStr: string): string {
  // Format: 20240115143025 → 2024-01-15T14:30:25
  if (timeStr.length === 14) {
    return `${timeStr.slice(0,4)}-${timeStr.slice(4,6)}-${timeStr.slice(6,8)}T${timeStr.slice(8,10)}:${timeStr.slice(10,12)}:${timeStr.slice(12,14)}`;
  }
  return new Date().toISOString();
}

function detectIntaSendChannel(provider: string): string {
  const p = (provider || '').toUpperCase();
  if (p.includes('MPESA')) return 'mpesa_c2b';
  if (p.includes('PESALINK')) return 'pesalink';
  if (p.includes('BANK')) return 'bank_transfer';
  return 'intasend';
}

async function getSystemSetting(key: string): Promise<string> {
  const { data } = await supabase
    .from('fuel_system_settings')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value || '';
}
