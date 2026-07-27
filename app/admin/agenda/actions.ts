'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createAgendaEvento } from '@/lib/admin/agenda';

export async function createAgendaEventoAction(formData: FormData) {
  await requireAdmin();

  const titulo = String(formData.get('titulo') ?? '').trim();
  const dataInicio = String(formData.get('data_inicio') ?? '').trim();

  if (!titulo || !dataInicio) {
    throw new Error('Titulo e data de inicio sao obrigatorios.');
  }

  await createAgendaEvento({
    titulo,
    descricao: String(formData.get('descricao') ?? '').trim() || null,
    data_inicio: new Date(dataInicio).toISOString(),
    data_fim: parseOptionalDate(formData.get('data_fim')),
    status: String(formData.get('status') ?? 'pendente').trim() || 'pendente',
    tipo: String(formData.get('tipo') ?? 'geral').trim() || 'geral',
    user_id: String(formData.get('user_id') ?? '').trim() || null,
    imovel_id: String(formData.get('imovel_id') ?? '').trim() || null,
  });

  revalidatePath('/admin/agenda');
  redirect('/admin/agenda');
}

function parseOptionalDate(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return null;
  }

  return new Date(rawValue).toISOString();
}
