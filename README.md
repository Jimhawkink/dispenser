# FuelFlow Pro — Fuel Dealer Management System 🚀⛽

A **cutting-edge, production-quality** fuel station management system built for Kenya. Handles M-Pesa (Daraja), PesaLink, IntaSend, Equity Bank (Jenga API), Africa's Talking SMS, and full auto-reconciliation.

## Features

- **🔄 Auto-Reconciliation Engine** — Automatically matches incoming M-Pesa/bank payments to customers
- **💳 Multi-Channel Payments** — M-Pesa STK Push, M-Pesa C2B Paybill, PesaLink, Equity Bank (Jenga), IntaSend, Cash
- **📊 Real-Time Dashboard** — Live payment feed via Supabase Realtime, KPI cards, charts
- **🛢️ Fuel POS** — Sales point with litres input, Pay Now / Pay Later credit system
- **📋 Credit Ledger** — Full debit/credit tracking per customer with aging reports
- **📱 SMS Alerts** — Africa's Talking integration for payment and sale confirmations
- **👥 Multi-User** — Admin / Cashier / Accountant roles with JWT auth
- **📈 Reports** — Daily, period summary, aging, payment channel breakdown

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS |
| Backend | Express 4 + TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (bcryptjs + jsonwebtoken) |
| M-Pesa | Daraja API (STK Push + C2B) |
| Bank | Equity Bank Jenga API |
| Aggregator | IntaSend (PesaLink + bank transfers) |
| SMS | Africa's Talking |
| Realtime | Supabase Realtime |
| Deploy | Vercel (frontend + backend) |

## Project Structure

```
dispenser/
├── fuel-backend/              # Express API server
│   ├── src/
│   │   ├── server.ts          # Entry point
│   │   ├── routes/            # Auth, Sales, Payments, etc.
│   │   ├── services/          # M-Pesa, IntaSend, Equity, SMS, Ledger
│   │   └── middleware/        # JWT auth, RBAC
│   └── database/
│       └── schema.sql         # Full Supabase DB schema
└── fuel-frontend/             # React web app
    └── src/
        ├── pages/             # Dashboard, Sales, Payments, etc.
        ├── components/        # Layout, shared, dashboard
        ├── hooks/             # useAuth, useRealtime
        └── services/          # Axios API client, Supabase
```

## Quick Start

### 1. Database (Supabase)
1. Create project at [supabase.com](https://supabase.com)
2. Run `fuel-backend/database/schema.sql` in SQL editor
3. Copy `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### 2. Backend
```bash
cd fuel-backend
npm install
cp .env.example .env    # Fill in credentials
npm run seed            # Creates default users + products
npm run dev             # Runs on http://localhost:5002
```

### 3. Frontend
```bash
cd fuel-frontend
npm install
cp .env.example .env    # Set VITE_API_URL=http://localhost:5002/api
npm run dev             # Opens http://localhost:5174
```

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fuelflow.co.ke | Admin@2024 |
| Cashier | cashier@fuelflow.co.ke | Cashier@2024 |
| Accountant | accounts@fuelflow.co.ke | Accounts@2024 |

> ⚠️ Change passwords immediately after first login!

## Webhook URLs

| Provider | URL |
|----------|-----|
| Daraja C2B Validation | `https://your-api.vercel.app/api/webhooks/daraja/c2b-validation` |
| Daraja C2B Confirmation | `https://your-api.vercel.app/api/webhooks/daraja/c2b-confirmation` |
| Daraja STK Callback | `https://your-api.vercel.app/api/webhooks/daraja/stk-callback` |
| IntaSend | `https://your-api.vercel.app/api/webhooks/intasend` |
| Equity Jenga IPN | `https://your-api.vercel.app/api/webhooks/equity` |

## Vercel Deployment

### Backend
```bash
cd fuel-backend
npm run build
vercel --prod
```
Set environment variables in Vercel dashboard from `.env.example`.

### Frontend
```bash
cd fuel-frontend
vercel --prod
```
Set `VITE_API_URL` to your deployed backend URL.

## License
MIT — Built for Kenyan fuel dealers 🇰🇪
