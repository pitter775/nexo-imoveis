import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { getSupabaseDatabaseEnv } from '@/lib/supabase/env';
import type { Database } from '@/lib/supabase/types';

export function createAdminClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseDatabaseEnv();

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
