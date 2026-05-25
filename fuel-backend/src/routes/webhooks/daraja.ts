import express, { Request, Response } from 'express';
import { processDarajaC2B, processDarajaSTKCallback } from '../../services/reconciliation.service';
import supabase from '../../config/supabase';

const router = express.Router();

// POST /api/webhooks/daraja/c2b-validation
// Safaricom calls this to validate before processing — always accept
router.post('/c2b-validation', (req: Request, res: Response) => {
  console.log('[Daraja C2B Validation]', JSON.stringify(req.body));
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// POST /api/webhooks/daraja/c2b-confirmation
// Called after successful M-Pesa Paybill payment
router.post('/c2b-confirmation', async (req: Request, res: Response) => {
  const payload = req.body;
  console.log('[Daraja C2B Confirmation]', JSON.stringify(payload));

  // Log raw webhook immediately
  await supabase.from('fuel_webhook_logs').insert({
    source: 'daraja', event_type: 'c2b_confirmation',
    raw_payload: payload, processed: false,
  });

  try {
    const paymentId = await processDarajaC2B(payload);
    await supabase.from('fuel_webhook_logs')
      .update({ processed: true, payment_id: paymentId, processing_notes: 'Processed successfully' })
      .eq('source', 'daraja').eq('processed', false).order('created_at', { ascending: false }).limit(1);
    console.log(`[Daraja C2B] Payment processed: ${paymentId}`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Daraja C2B] Processing error:', errorMsg);
    await supabase.from('fuel_webhook_logs')
      .update({ processed: false, processing_error: errorMsg })
      .eq('source', 'daraja').eq('processed', false).order('created_at', { ascending: false }).limit(1);
  }

  // Always return 200 to Safaricom
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// POST /api/webhooks/daraja/stk-callback
// STK Push payment result callback
router.post('/stk-callback', async (req: Request, res: Response) => {
  const payload = req.body;
  console.log('[Daraja STK Callback]', JSON.stringify(payload));

  await supabase.from('fuel_webhook_logs').insert({
    source: 'daraja', event_type: 'stk_callback',
    raw_payload: payload, processed: false,
  });

  try {
    await processDarajaSTKCallback(payload);
    await supabase.from('fuel_webhook_logs')
      .update({ processed: true, processing_notes: 'STK callback processed' })
      .eq('source', 'daraja').eq('processed', false).order('created_at', { ascending: false }).limit(1);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Daraja STK] Callback error:', errorMsg);
  }

  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

export default router;
