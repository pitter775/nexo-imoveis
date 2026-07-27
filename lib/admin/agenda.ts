import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type AgendaEventoRecord = {
  id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  status: string;
  tipo: string;
  user_id: string | null;
  imovel_id: string | null;
  created_at: string;
  usuario?: {
    nome: string | null;
    email: string;
  } | null;
  imovel?: {
    titulo: string;
    cidade: string | null;
    estado: string | null;
  } | null;
};

export type AgendaEventoInput = {
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  status: string;
  tipo: string;
  user_id: string | null;
  imovel_id: string | null;
};

export async function listAgendaEventos() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('agenda_eventos')
    .select(
      'id, titulo, descricao, data_inicio, data_fim, status, tipo, user_id, imovel_id, created_at, usuario:users(nome, email), imovel:imoveis(titulo, cidade, estado)',
    )
    .order('data_inicio', { ascending: true });

  if (error) {
    throw new Error(`Failed to list agenda events: ${error.message}`);
  }

  return (data ?? []) as unknown as AgendaEventoRecord[];
}

export async function createAgendaEvento(input: AgendaEventoInput) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('agenda_eventos').insert(input);

  if (error) {
    throw new Error(`Failed to create agenda event: ${error.message}`);
  }
}
