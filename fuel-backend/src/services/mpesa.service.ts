import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const DARAJA_ENV = process.env.DARAJA_ENV || 'sandbox';
const BASE_URL = DARAJA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

const CONSUMER_KEY = process.env.DARAJA_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.DARAJA_CONSUMER_SECRET!;
const SHORTCODE = process.env.DARAJA_SHORTCODE!;
const PASSKEY = process.env.DARAJA_PASSKEY!;
const CALLBACK_URL = process.env.DARAJA_CALLBACK_URL!;

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const res = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return cachedToken!;
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
}

function getPassword(timestamp: string): string {
  return Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
}

export async function initiateSTKPush(phone: string, amount: number, accountRef: string, description: string) {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = getPassword(timestamp);
  const formattedPhone = phone.startsWith('0') ? `254${phone.slice(1)}` : phone.startsWith('+') ? phone.slice(1) : phone;

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount),
    PartyA: formattedPhone,
    PartyB: SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: `${CALLBACK_URL}/api/webhooks/daraja/stk-callback`,
    AccountReference: accountRef,
    TransactionDesc: description,
  };

  const res = await axios.post(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.data;
}

export async function registerC2BUrls(shortcode: string) {
  const token = await getAccessToken();
  const payload = {
    ShortCode: shortcode,
    ResponseType: 'Completed',
    ConfirmationURL: `${CALLBACK_URL}/api/webhooks/daraja/c2b-confirmation`,
    ValidationURL: `${CALLBACK_URL}/api/webhooks/daraja/c2b-validation`,
  };
  const res = await axios.post(`${BASE_URL}/mpesa/c2b/v1/registerurl`, payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.data;
}

export async function querySTKStatus(checkoutRequestId: string) {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = getPassword(timestamp);
  const res = await axios.post(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    BusinessShortCode: SHORTCODE, Password: password, Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  return res.data;
}
