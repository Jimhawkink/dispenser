import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Equity Bank Jenga API Service
 * Docs: https://jengahq.io
 * Features:
 *  - RSA-signed authentication
 *  - Account balance inquiry
 *  - Mini statement (incoming credits)
 *  - Send money (internal/external transfer)
 *  - IPN webhook processing for credit alerts
 */

const JENGA_ENV = process.env.JENGA_ENV || 'sandbox';
const BASE_URL = JENGA_ENV === 'production'
  ? 'https://api.jengahq.io'
  : 'https://uat.jengahq.io';

const API_KEY = process.env.JENGA_API_KEY || '';
const MERCHANT_CODE = process.env.JENGA_MERCHANT_CODE || '';
const CONSUMER_SECRET = process.env.JENGA_CONSUMER_SECRET || '';
const PRIVATE_KEY = (process.env.JENGA_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const EQUITY_ACCOUNT = process.env.EQUITY_ACCOUNT_NUMBER || '';
const EQUITY_COUNTRY = process.env.EQUITY_COUNTRY_CODE || 'KE';

let cachedToken: string | null = null;
let tokenExpiry = 0;

// ── Auth ─────────────────────────────────────────────────
function generateSignature(fields: string[]): string {
  const data = fields.join('');
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(PRIVATE_KEY, 'base64');
}

export async function getJengaToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const timestamp = Date.now().toString();
  const signature = generateSignature([MERCHANT_CODE, timestamp]);

  const res = await axios.post(
    `${BASE_URL}/identity/v2/token`,
    { merchantCode: MERCHANT_CODE, consumerSecret: CONSUMER_SECRET },
    {
      headers: {
        'Api-Key': API_KEY,
        Authorization: `Signature ${signature}`,
        'Content-Type': 'application/json',
      },
    }
  );

  cachedToken = res.data.accessToken;
  // Tokens valid for 1 hour; cache for 55 minutes
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return cachedToken!;
}

function authHeaders(extraHeaders: Record<string, string> = {}) {
  return async () => {
    const token = await getJengaToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Api-Key': API_KEY,
      ...extraHeaders,
    };
  };
}

// ── Account Balance ───────────────────────────────────────
export async function getAccountBalance(
  accountNumber = EQUITY_ACCOUNT,
  countryCode = EQUITY_COUNTRY
) {
  const token = await getJengaToken();
  const signature = generateSignature([countryCode, accountNumber]);

  const res = await axios.get(
    `${BASE_URL}/account/v2/accounts/balances/${countryCode}/${accountNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Api-Key': API_KEY,
        signature,
      },
    }
  );
  return res.data;
}

// ── Mini Statement (last N transactions) ─────────────────
export async function getMiniStatement(
  accountNumber = EQUITY_ACCOUNT,
  countryCode = EQUITY_COUNTRY
) {
  const token = await getJengaToken();
  const signature = generateSignature([countryCode, accountNumber]);

  const res = await axios.get(
    `${BASE_URL}/account/v2/accounts/ministatement/${countryCode}/${accountNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Api-Key': API_KEY,
        signature,
      },
    }
  );
  return res.data;
}

// ── Full Account Statement ────────────────────────────────
export async function getAccountStatement(
  fromDate: string,
  toDate: string,
  accountNumber = EQUITY_ACCOUNT,
  countryCode = EQUITY_COUNTRY
) {
  const token = await getJengaToken();
  const signature = generateSignature([countryCode, accountNumber, fromDate, toDate]);

  const res = await axios.post(
    `${BASE_URL}/account/v2/accounts/transactions`,
    {
      countryCode,
      accountNumber,
      fromDate,
      toDate,
      transactionType: 'Credit',
      limit: 100,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Api-Key': API_KEY,
        signature,
      },
    }
  );
  return res.data;
}

// ── Send Money (Internal Transfer within Equity) ─────────
export async function sendMoneyInternal(
  toAccount: string,
  toName: string,
  amount: number,
  reference: string,
  narration: string
) {
  const token = await getJengaToken();
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const transferPayload = {
    source: {
      countryCode: EQUITY_COUNTRY,
      name: process.env.BUSINESS_NAME || 'FuelFlow Pro',
      accountNumber: EQUITY_ACCOUNT,
    },
    destination: {
      type: 'bank',
      countryCode: EQUITY_COUNTRY,
      name: toName,
      bankCode: '68',  // Equity Bank code
      accountNumber: toAccount,
    },
    transfer: {
      type: 'InternalFundsTransfer',
      amount: amount.toFixed(2),
      currencyCode: 'KES',
      reference,
      date: timestamp,
      description: narration,
    },
  };

  const signature = generateSignature([
    MERCHANT_CODE,
    reference,
    amount.toFixed(2),
    EQUITY_ACCOUNT,
  ]);

  const res = await axios.post(
    `${BASE_URL}/transaction/v2/transfers/internal`,
    transferPayload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Api-Key': API_KEY,
        signature,
      },
    }
  );
  return res.data;
}

// ── Send Money (External / EFT / RTGS) ───────────────────
export async function sendMoneyExternal(
  toBankCode: string,
  toAccount: string,
  toName: string,
  amount: number,
  reference: string,
  narration: string
) {
  const token = await getJengaToken();
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const transferPayload = {
    source: {
      countryCode: EQUITY_COUNTRY,
      name: process.env.BUSINESS_NAME || 'FuelFlow Pro',
      accountNumber: EQUITY_ACCOUNT,
    },
    destination: {
      type: 'bank',
      countryCode: EQUITY_COUNTRY,
      name: toName,
      bankCode: toBankCode,
      accountNumber: toAccount,
    },
    transfer: {
      type: 'EFT',
      amount: amount.toFixed(2),
      currencyCode: 'KES',
      reference,
      date: timestamp,
      description: narration,
    },
  };

  const signature = generateSignature([
    MERCHANT_CODE,
    reference,
    amount.toFixed(2),
    EQUITY_ACCOUNT,
  ]);

  const res = await axios.post(
    `${BASE_URL}/transaction/v2/transfers/external`,
    transferPayload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Api-Key': API_KEY,
        signature,
      },
    }
  );
  return res.data;
}

// ── Parse IPN Webhook Payload (Credit Notification) ──────
export interface JengaIPNPayload {
  transactionReference: string;
  transactionDate: string;
  amount: string;
  currency: string;
  accountNumber: string;
  senderName: string;
  senderAccountNumber: string;
  senderBank: string;
  narration: string;
  transactionType: 'CREDIT' | 'DEBIT';
  balance: string;
  [key: string]: unknown;
}

export function parseJengaIPN(body: Record<string, unknown>): JengaIPNPayload | null {
  try {
    // Jenga IPN format varies — handle both direct and nested payloads
    const data = (body.notification || body.transaction || body) as Record<string, unknown>;
    if (!data.transactionReference && !data.transactionId) return null;
    return {
      transactionReference: (data.transactionReference || data.transactionId || '') as string,
      transactionDate: (data.transactionDate || data.date || new Date().toISOString()) as string,
      amount: (data.amount || '0').toString(),
      currency: (data.currency || 'KES') as string,
      accountNumber: (data.accountNumber || data.creditAccount || EQUITY_ACCOUNT) as string,
      senderName: (data.senderName || data.initiatorName || '') as string,
      senderAccountNumber: (data.senderAccountNumber || '') as string,
      senderBank: (data.senderBank || data.sourceBank || 'Equity Bank') as string,
      narration: (data.narration || data.description || '') as string,
      transactionType: ((data.transactionType || data.type || 'CREDIT') as string).toUpperCase() as 'CREDIT' | 'DEBIT',
      balance: (data.balance || '0').toString(),
    };
  } catch {
    return null;
  }
}

// ── Poll for new credits (fallback if webhooks not configured) ─
export async function pollNewCredits(sinceDate: string): Promise<JengaIPNPayload[]> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const statement = await getAccountStatement(sinceDate, today);
    const transactions = statement?.data?.transactions || statement?.transactions || [];
    return transactions
      .filter((t: Record<string, unknown>) => (t.transactionType === 'CREDIT' || t.type === 'C'))
      .map((t: Record<string, unknown>) => ({
        transactionReference: (t.transactionReference || t.chequeNumber || t.id || '') as string,
        transactionDate: (t.transactionDate || t.date || '') as string,
        amount: (t.amount || '0').toString(),
        currency: 'KES',
        accountNumber: EQUITY_ACCOUNT,
        senderName: (t.payerName || t.senderName || '') as string,
        senderAccountNumber: (t.payerAccount || '') as string,
        senderBank: (t.payerBank || '') as string,
        narration: (t.narration || t.description || '') as string,
        transactionType: 'CREDIT' as const,
        balance: (t.runningBalance || '0').toString(),
      }));
  } catch (err) {
    console.error('[Jenga] Poll error:', err);
    return [];
  }
}
