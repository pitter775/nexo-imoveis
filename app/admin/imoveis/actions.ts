'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createImovel, updateImovel } from '@/lib/admin/imoveis';
import { requireAdmin } from '@/lib/auth';

export async function createImovelAction(formData: FormData) {
  await requireAdmin();

  await createImovel(parseImovelFormData(formData));
  revalidatePath('/admin/imoveis');
  redirect('/admin/imoveis');
}

export async function updateImovelAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  if (!id) {
    throw new Error('Imovel id is required.');
  }

  await updateImovel(id, parseImovelFormData(formData));
  revalidatePath('/admin/imoveis');
  revalidatePath(`/admin/imoveis/${id}`);
  redirect('/admin/imoveis');
}

function parseImovelFormData(formData: FormData) {
  return {
    titulo: String(formData.get('titulo') ?? '').trim(),
    descricao: String(formData.get('descricao') ?? '').trim(),
    tipo_leilao: String(formData.get('tipo_leilao') ?? '').trim(),
    tipo_propriedade: String(formData.get('tipo_propriedade') ?? '').trim(),
    valor_avaliacao: Number(formData.get('valor_avaliacao') ?? 0),
    valor_minimo: Number(formData.get('valor_minimo') ?? 0),
    quartos: parseOptionalInteger(formData.get('quartos')),
    banheiros: parseOptionalInteger(formData.get('banheiros')),
    area_total: parseOptionalNumber(formData.get('area_total')),
    area_construida: parseOptionalNumber(formData.get('area_construida')),
    ano_construcao: parseOptionalInteger(formData.get('ano_construcao')),
    rua: String(formData.get('rua') ?? '').trim(),
    numero: String(formData.get('numero') ?? '').trim(),
    complemento: String(formData.get('complemento') ?? '').trim(),
    cidade: String(formData.get('cidade') ?? '').trim(),
    estado: String(formData.get('estado') ?? '').trim(),
    cep: String(formData.get('cep') ?? '').trim(),
    data_leilao: String(formData.get('data_leilao') ?? ''),
    status: String(formData.get('status') ?? '').trim(),
  };
}

function parseOptionalInteger(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}
