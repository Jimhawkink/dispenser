import express, { Request, Response } from 'express';
import supabase from '../../config/supabase';
import { parseJengaIPN, JengaIPNPayload, getAccountBalance, getMiniStatement } from '../../services/equity.service';
import { reconcilePayment } from '../../services/reconciliation.service';

const router = express.Router();

/**
 * POST /api/webhooks/equity
 * Equity Bank Jenga IPN — called when money is credited to the dealer's account.
 * Configure in JengaHQ dashboard → Settings → IPN → Add your callback URL.
 * The dealer's account gets notified for:
 *  - Direct cash deposits at Equity branch
 *  - PesaLink transfers into Equity account
 *  - RTGS / EFT transfers
 *  - Equity mobile transfers
 */
router.post('/', async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  console.log('[Equity IPN]', JSON.stringify(body));

  // Log raw webhook immediately
  const { data: logEntry } = await supabase.from('fuel_webhook_logs').insert({
    source: 'equity',
    event_type: 'account_credit',
    raw_payload: body,
    processed: false,
  }).select('id').single();

  try {
    const ipn = parseJengaIPN(body);

    if (!ipn) {
      await supabase.from('fuel_webhook_logs').update({
        processed: true,
        processing_notes: 'Ignored: could not parse IPN payload',
      }).eq('id', logEntry?.id);
      res.status(200).json({ status: 'received' });
      return;
    }

    // Only process CREDIT transactions
    if (ipn.transactionType !== 'CREDIT') {
      await supabase.from('fuel_webhook_logs').update({
        processed: true,
        processing_notes: `Ignored: DEBIT transaction ${ipn.transactionReference}`,
      }).eq('id', logEntry?.id);
      res.status(200).json({ status: 'received' });
      return;
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('fuel_payments')
      .select('id')
      .eq('transaction_reference', ipn.transactionReference)
      .single();

    if (existing) {
      await supabase.from('fuel_webhook_logs').update({
        processed: true,
        processing_notes: `Duplicate: ${ipn.transactionReference}`,
      }).eq('id', logEntry?.id);
      res.status(200).json({ status: 'received' });
      return;
    }

    const amount = parseFloat(ipn.amount);
    if (amount <= 0) {
      res.status(200).json({ status: 'received' });
      return;
    }

    // Determine channel — Jenga narrations often contain clues
    const channel = detectEquityChannel(ipn);

    // Insert payment record
    const { data: inserted } = await supabase.from('fuel_payments').insert({
      amount,
      payment_channel: channel,
      transaction_reference: ipn.transactionReference,
      phone_number: null,
      payer_name: ipn.senderName || null,
      payment_date: parseJengaDate(ipn.transactionDate),
      status: 'pending',
      auto_matched: false,
      raw_webhook_payload: body,
    }).select('id').single();

    if (inserted) {
      const result = await reconcilePayment(inserted.id);
      await supabase.from('fuel_webhook_logs').update({
        processed: true,
        payment_id: inserted.id,
        processing_notes: result.matched
          ? `Matched to customer ${result.customerId}`
          : 'Processed — awaiting manual match',
      }).eq('id', logEntry?.id);
    }

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Equity IPN] Error:', errorMsg);
    await supabase.from('fuel_webhook_logs').update({
      processed: false,
      processing_error: errorMsg,
    }).eq('id', logEntry?.id);
  }

  // Always return 200 to Jenga
  res.status(200).json({ status: 'received' });
});

/**
 * GET /api/webhooks/equity/balance
 * Check current Equity account balance (useful for dashboard)
 */
router.get('/balance', async (_req: Request, res: Response) => {
  try {
    const balance = await getAccountBalance();
    res.json({ success: true, data: balance });
  } catch (err) {
    console.error('[Equity Balance]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch Equity balance' });
  }
});

/**
 * GET /api/webhooks/equity/mini-statement
 * Fetch last transactions from Equity account
 */
router.get('/mini-statement', async (_req: Request, res: Response) => {
  try {
    const statement = await getMiniStatement();
    res.json({ success: true, data: statement });
  } catch (err) {
    console.error('[Equity Mini Statement]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch mini statement' });
  }
});

// ── Helpers ──────────────────────────────────────────────

function detectEquityChannel(ipn: JengaIPNPayload): string {
  const narration = (ipn.narration || '').toUpperCase();
  const senderBank = (ipn.senderBank || '').toUpperCase();

  if (narration.includes('PESALINK') || narration.includes('PESA LINK')) return 'pesalink';
  if (narration.includes('MPESA') || narration.includes('M-PESA')) return 'mpesa_c2b';
  if (narration.includes('RTGS') || narration.includes('EFT')) return 'bank_transfer';
  if (senderBank && senderBank !== 'EQUITY' && senderBank !== 'EQUITY BANK') return 'bank_transfer';
  return 'bank_deposit'; // Cash deposit or same-bank transfer
}

function parseJengaDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  // Jenga dates come in various formats: DD-MM-YYYY, YYYY-MM-DD, timestamps
  try {
    if (dateStr.includes('-') && dateStr.length === 10) {
      const [a, b, c] = dateStr.split('-');
      // If first part is 4 digits, it's YYYY-MM-DD; else DD-MM-YYYY
      if (a.length === 4) return new Date(dateStr).toISOString();
      return new Date(`${c}-${b}-${a}`).toISOString();
    }
    return new Date(dateStr).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export default router;
