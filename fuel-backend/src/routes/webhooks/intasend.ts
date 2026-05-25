import express, { Request, Response } from 'express';
import { processIntaSendWebhook } from '../../services/reconciliation.service';
import supabase from '../../config/supabase';
import { IntaSendWebhookPayload } from '../../types';

const router = express.Router();

// POST /api/webhooks/intasend
router.post('/', async (req: Request, res: Response) => {
  const payload = req.body as IntaSendWebhookPayload;
  console.log('[IntaSend Webhook]', JSON.stringify(payload));

  await supabase.from('fuel_webhook_logs').insert({
    source: 'intasend',
    event_type: `payment_${payload.state || 'unknown'}`,
    raw_payload: payload as unknown as Record<string, unknown>,
    processed: false,
  });

  try {
    if (payload.state === 'COMPLETE') {
      await processIntaSendWebhook(payload);
      await supabase.from('fuel_webhook_logs')
        .update({ processed: true, processing_notes: 'IntaSend payment processed' })
        .eq('source', 'intasend').eq('processed', false).order('created_at', { ascending: false }).limit(1);
      console.log('[IntaSend] Payment processed for invoice:', payload.invoice_id);
    } else {
      console.log('[IntaSend] Ignoring non-COMPLETE state:', payload.state);
      await supabase.from('fuel_webhook_logs')
        .update({ processed: true, processing_notes: `Ignored: state=${payload.state}` })
        .eq('source', 'intasend').eq('processed', false).order('created_at', { ascending: false }).limit(1);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[IntaSend] Processing error:', errorMsg);
    await supabase.from('fuel_webhook_logs')
      .update({ processed: false, processing_error: errorMsg })
      .eq('source', 'intasend').eq('processed', false).order('created_at', { ascending: false }).limit(1);
  }

  // Always respond 200 so IntaSend doesn't retry
  res.status(200).json({ status: 'received' });
});

export default router;
