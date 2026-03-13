import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv } from '@/lib/supabase/env';
import type { Database } from '@/lib/supabase/types';

export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }>,
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
