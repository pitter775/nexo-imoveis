import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import type { Database, Json } from '@/lib/supabase/types';

export type AdminLogLevel = 'info' | 'warn' | 'error';

export type AdminLogInput = {
  origem: string;
  nivel?: AdminLogLevel;
  etapa?: string | null;
  contexto?: string | null;
  imovel_id?: string | null;
  arquivo_id?: string | null;
  mensagem: string;
  detalhes?: Record<string, unknown>;
};

export async function logAdminEvent(input: AdminLogInput) {
  await logAdminEvents([input]);
}

export async function logAdminEvents(entries: AdminLogInput[]) {
  if (entries.length === 0) {
    return;
  }

  const supabase = createAdminClient();
  const payload: Database['public']['Tables']['admin_logs']['Insert'][] = entries.map((entry) => ({
    origem: entry.origem,
    nivel: entry.nivel ?? 'info',
    etapa: entry.etapa ?? null,
    contexto: entry.contexto ?? null,
    imovel_id: entry.imovel_id ?? null,
    arquivo_id: entry.arquivo_id ?? null,
    mensagem: entry.mensagem,
    detalhes: ((entry.detalhes ?? {}) as Json) ?? {},
  }));

  const { error } = await supabase.from('admin_logs').insert(payload);

  if (error) {
    throw new Error(`Failed to write admin logs: ${error.message}`);
  }
}
