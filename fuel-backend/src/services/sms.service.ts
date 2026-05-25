import dotenv from 'dotenv';
dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AfricasTalking = require('africastalking');

const at = AfricasTalking({
  username: process.env.AT_USERNAME || 'sandbox',
  apiKey: process.env.AT_API_KEY || '',
});

const sms = at.SMS;
const SENDER_ID = process.env.AT_SENDER_ID || 'FUELFLOW';

export async function sendSMS(to: string, message: string): Promise<void> {
  try {
    const phone = to.startsWith('0') ? `+254${to.slice(1)}` : to.startsWith('254') ? `+${to}` : to;
    await sms.send({ to: [phone], message, from: SENDER_ID });
    console.log(`[SMS] Sent to ${phone}: ${message.substring(0, 50)}...`);
  } catch (err) {
    console.error('[SMS] Failed to send:', err);
  }
}

export async function sendPaymentReceivedSMS(customerName: string, phone: string, amount: number, ref: string, balance: number): Promise<void> {
  const msg = `Dear ${customerName}, payment of KES ${amount.toLocaleString()} received. Ref: ${ref}. Outstanding balance: KES ${balance.toLocaleString()}. Thank you - FuelFlow Pro`;
  await sendSMS(phone, msg);
}

export async function sendSaleConfirmationSMS(customerName: string, phone: string, saleNumber: string, amount: number, litres: number, fuelType: string): Promise<void> {
  const msg = `Dear ${customerName}, sale ${saleNumber} confirmed: ${litres}L ${fuelType} = KES ${amount.toLocaleString()}. Thank you for your business! - FuelFlow Pro`;
  await sendSMS(phone, msg);
}

export async function sendCreditReminderSMS(customerName: string, phone: string, balance: number): Promise<void> {
  const msg = `Dear ${customerName}, your outstanding fuel credit balance is KES ${balance.toLocaleString()}. Please settle at your earliest convenience. - FuelFlow Pro`;
  await sendSMS(phone, msg);
}

export async function sendLowStockAlertSMS(adminPhone: string, fuelType: string, stockLitres: number): Promise<void> {
  const msg = `[ALERT] Low stock: ${fuelType} is at ${stockLitres.toLocaleString()}L. Please arrange restocking immediately. - FuelFlow Pro`;
  await sendSMS(adminPhone, msg);
}
