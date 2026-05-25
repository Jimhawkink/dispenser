import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Payment } from '../types';

type RealtimeCallback = (payment: Payment) => void;

export function useRealtimePayments(onNewPayment: RealtimeCallback) {
  const callbackRef = useRef(onNewPayment);
  callbackRef.current = onNewPayment;

  useEffect(() => {
    if (!supabase) {
      console.warn('[Realtime] Supabase not configured — using polling fallback');
      return;
    }

    const channel = supabase
      .channel('fuel_payments_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fuel_payments' },
        (payload) => {
          console.log('[Realtime] New payment received:', payload.new);
          callbackRef.current(payload.new as Payment);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    return () => { supabase.removeChannel(channel); };
  }, []);
}

export function useRealtimeSales(onNewSale: (sale: unknown) => void) {
  const callbackRef = useRef(onNewSale);
  callbackRef.current = onNewSale;

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('fuel_sales_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fuel_sales' },
        (payload) => callbackRef.current(payload.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
}

export function usePollingFallback(fetchFn: () => void, intervalMs = 30000) {
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;
  useEffect(() => {
    const id = setInterval(() => fetchRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
