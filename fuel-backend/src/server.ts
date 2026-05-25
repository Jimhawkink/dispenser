import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';

dotenv.config();

import authRouter from './routes/auth';
import customersRouter from './routes/customers';
import productsRouter from './routes/products';
import salesRouter from './routes/sales';
import paymentsRouter from './routes/payments';
import stockRouter from './routes/stock';
import reportsRouter from './routes/reports';
import settingsRouter from './routes/settings';
import dashboardRouter from './routes/dashboard';
import darajaRouter from './routes/webhooks/daraja';
import intasendRouter from './routes/webhooks/intasend';
import equityRouter from './routes/webhooks/equity';
import supabase from './config/supabase';
import { sendLowStockAlertSMS } from './services/sms.service';

const app = express();
const PORT = parseInt(process.env.PORT || '5002');

// ── Security & Middleware ──────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5174',
    'https://*.vercel.app',
  ],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ──────────────────────────────────────────
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: { success: false, error: 'Too many requests' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, error: 'Too many login attempts' } });

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

// ── Health check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'FuelFlow Pro API', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ── Webhook routes (no auth, but validated) ───────────────
// Must be before json parser for raw body access if needed
app.use('/api/webhooks/daraja', darajaRouter);
app.use('/api/webhooks/intasend', intasendRouter);
app.use('/api/webhooks/equity', equityRouter);

// ── API routes ────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/customers', customersRouter);
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/stock', stockRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/dashboard', dashboardRouter);

// ── 404 handler ───────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Scheduled Jobs ────────────────────────────────────────
// Check low stock every day at 7am Kenya time (UTC+3 = 4am UTC)
cron.schedule('0 4 * * *', async () => {
  console.log('[Cron] Running daily low stock check...');
  try {
    const { data: products } = await supabase.from('fuel_products')
      .select('name, current_stock_litres, low_stock_alert_litres').eq('is_active', true);
    const lowStock = (products || []).filter(p => p.current_stock_litres <= p.low_stock_alert_litres);
    if (lowStock.length > 0) {
      const { data: setting } = await supabase.from('fuel_system_settings').select('value').eq('key', 'business_phone').single();
      const { data: alertSetting } = await supabase.from('fuel_system_settings').select('value').eq('key', 'low_stock_alerts').single();
      if (alertSetting?.value === 'true' && setting?.value) {
        for (const p of lowStock) {
          await sendLowStockAlertSMS(setting.value, p.name, p.current_stock_litres);
        }
      }
    }
  } catch (err) {
    console.error('[Cron] Low stock check failed:', err);
  }
});

// ── Start server ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║     FuelFlow Pro API — Running       ║
║     Port: ${PORT}                       ║
║     Env:  ${process.env.NODE_ENV || 'development'}              ║
╚══════════════════════════════════════╝
  `);
});

export default app;
