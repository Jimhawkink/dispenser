import dotenv from 'dotenv';
dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const IntaSend = require('intasend-node');

const publishableKey = process.env.INTASEND_PUBLISHABLE_KEY!;
const secretKey = process.env.INTASEND_SECRET_KEY!;
const isSandbox = process.env.INTASEND_IS_SANDBOX === 'true';

function getClient() {
  return new IntaSend(publishableKey, secretKey, isSandbox);
}

export async function initiateIntaSendSTKPush(phone: string, amount: number, reference: string) {
  const client = getClient();
  const formattedPhone = phone.startsWith('0') ? `254${phone.slice(1)}` : phone.replace('+', '');
  return await client.collection().stkPush({
    amount: Math.ceil(amount).toString(),
    currency: 'KES',
    phone_number: formattedPhone,
    account: reference,
  });
}

export async function checkPaymentStatus(invoiceId: string) {
  const client = getClient();
  return await client.collection().status(invoiceId);
}

export function verifyIntaSendWebhook(payload: Record<string, unknown>): boolean {
  // IntaSend webhook verification — check state is COMPLETE
  return payload && payload.state === 'COMPLETE';
}
