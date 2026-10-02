import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseDatabaseEnv } from '@/lib/supabase/env';
import type { SubscriptionDatabase } from './subscription-management-types';

export function subscriptionManagementEnabled() {
  return process.env.SUBSCRIPTION_MANAGEMENT_ENABLED === 'true';
}

export function createSubscriptionClient() {
  if (!subscriptionManagementEnabled()) throw new Error('Gestão de assinaturas ainda não ativada.');
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseDatabaseEnv();
  return createClient<SubscriptionDatabase>(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
