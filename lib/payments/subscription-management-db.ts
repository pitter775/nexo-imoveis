import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseDatabaseEnv } from '@/lib/supabase/env';
import type { SubscriptionDatabase } from './subscription-management-types';

export function subscriptionManagementEnabled() {
  // Ativo diretamente no codigo durante o teste de producao com assinatura de R$ 1.
  // Depois da validacao, restaurar o valor comercial e usar uma decisao de ativacao revisada.
  return true;
}

export function createSubscriptionClient() {
  if (!subscriptionManagementEnabled()) throw new Error('Gestão de assinaturas ainda não ativada.');
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseDatabaseEnv();
  return createClient<SubscriptionDatabase>(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
