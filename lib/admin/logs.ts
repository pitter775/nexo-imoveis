import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

type AdminLogRow = {
  id: string;
  origem: string;
  nivel: string;
  etapa: string | null;
  contexto: string | null;
  imovel_id: string | null;
  arquivo_id: string | null;
  mensagem: string;
  created_at: string;
};

type ArquivoLookup = {
  id: string;
  nome_arquivo: string | null;
};

type ImovelLookup = {
  id: string;
  titulo: string;
};

export type AdminLogEntry = {
  id: string;
  when: string;
  status: string;
  stage: string;
  level: 'info' | 'warn' | 'error';
  fileName: string;
  imovelTitulo: string;
  message: string;
};

export async function listAdminLogs(limit = 300): Promise<AdminLogEntry[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('admin_logs')
    .select('id, origem, nivel, etapa, contexto, imovel_id, arquivo_id, mensagem, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load admin logs: ${error.message}`);
  }

  const rows = (data ?? []) as AdminLogRow[];

  if (rows.length === 0) {
    return [];
  }

  const arquivoIds = Array.from(
    new Set(
      rows
        .map((row) => row.arquivo_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const imovelIds = Array.from(
    new Set(
      rows
        .map((row) => row.imovel_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [arquivosResponse, imoveisResponse] = await Promise.all([
    arquivoIds.length
      ? supabase.from('imovel_arquivos').select('id, nome_arquivo').in('id', arquivoIds)
      : Promise.resolve({ data: [], error: null }),
    imovelIds.length
      ? supabase.from('imoveis').select('id, titulo').in('id', imovelIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (arquivosResponse.error) {
    throw new Error(`Failed to load log files: ${arquivosResponse.error.message}`);
  }

  if (imoveisResponse.error) {
    throw new Error(`Failed to load log properties: ${imoveisResponse.error.message}`);
  }

  const arquivoById = new Map(
    ((arquivosResponse.data ?? []) as ArquivoLookup[]).map((item) => [item.id, item]),
  );
  const imovelById = new Map(
    ((imoveisResponse.data ?? []) as ImovelLookup[]).map((item) => [item.id, item]),
  );

  return rows.map((row) => ({
    id: row.id,
    when: row.created_at,
    status: row.origem,
    stage: row.etapa ?? row.contexto ?? 'geral',
    level: normalizeLevel(row.nivel),
    fileName: arquivoById.get(row.arquivo_id ?? '')?.nome_arquivo ?? 'Arquivo nao identificado',
    imovelTitulo: imovelById.get(row.imovel_id ?? '')?.titulo ?? 'Imovel nao identificado',
    message: row.mensagem,
  }));
}

function normalizeLevel(value: string): 'info' | 'warn' | 'error' {
  if (value === 'warn' || value === 'error') {
    return value;
  }

  return 'info';
}
