import supabase from '../config/supabase';

/**
 * Add a debit entry (customer owes more money)
 */
export async function addDebitEntry(
  customerId: string,
  amount: number,
  referenceType: string,
  referenceId: string,
  referenceCode: string,
  description: string,
  userId?: string
): Promise<number> {
  // Get current balance
  const { data: customer } = await supabase
    .from('fuel_customers')
    .select('current_balance')
    .eq('id', customerId)
    .single();

  const currentBalance = customer?.current_balance || 0;
  const newBalance = currentBalance + amount;

  // Insert ledger entry
  await supabase.from('fuel_credit_ledger').insert({
    customer_id: customerId,
    entry_type: 'debit',
    amount,
    running_balance: newBalance,
    reference_type: referenceType,
    reference_id: referenceId,
    reference_code: referenceCode,
    description,
    created_by: userId || null,
  });

  // Update customer balance
  await supabase
    .from('fuel_customers')
    .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', customerId);

  return newBalance;
}

/**
 * Add a credit entry (customer paid or balance reduced)
 */
export async function addCreditEntry(
  customerId: string,
  amount: number,
  referenceType: string,
  referenceId: string,
  referenceCode: string,
  description: string,
  userId?: string
): Promise<number> {
  const { data: customer } = await supabase
    .from('fuel_customers')
    .select('current_balance')
    .eq('id', customerId)
    .single();

  const currentBalance = customer?.current_balance || 0;
  const newBalance = Math.max(0, currentBalance - amount);

  await supabase.from('fuel_credit_ledger').insert({
    customer_id: customerId,
    entry_type: 'credit',
    amount,
    running_balance: newBalance,
    reference_type: referenceType,
    reference_id: referenceId,
    reference_code: referenceCode,
    description,
    created_by: userId || null,
  });

  await supabase
    .from('fuel_customers')
    .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', customerId);

  return newBalance;
}

export async function getCustomerBalance(customerId: string): Promise<number> {
  const { data } = await supabase
    .from('fuel_customers')
    .select('current_balance')
    .eq('id', customerId)
    .single();
  return data?.current_balance || 0;
}

export async function getCustomerLedger(customerId: string, limit = 50) {
  const { data } = await supabase
    .from('fuel_credit_ledger')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}
