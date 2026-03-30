'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createImovel,
  deleteAllImoveis,
  deleteImovel,
  updateImovel,
  updateImovelStatus,
  upsertImovelDetalhes,
} from '@/lib/admin/imoveis';
import { requireAdmin } from '@/lib/auth';

export type BulkDeleteImoveisState = {
  error?: string;
};

export async function createImovelAction(formData: FormData) {
  await requireAdmin();

  const id = await createImovel(parseImovelFormData(formData));
  revalidatePath('/admin/imoveis');
  revalidatePath(`/admin/imoveis/${id}`);
  redirect(`/admin/imoveis/${id}`);
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

export async function updateImovelDetalhesAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  if (!id) {
    throw new Error('Imovel id is required.');
  }

  await upsertImovelDetalhes(id, parseImovelDetalhesFormData(formData));
  revalidatePath(`/admin/imoveis/${id}`);
  redirect(`/admin/imoveis/${id}`);
}

export async function inactivateImovelAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  if (!id) {
    throw new Error('Imovel id is required.');
  }

  await updateImovelStatus(id, 'inativo');
  revalidatePath('/admin/imoveis');
  revalidatePath(`/admin/imoveis/${id}`);
}

export async function deleteImovelAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  if (!id) {
    throw new Error('Imovel id is required.');
  }

  await deleteImovel(id);
  revalidatePath('/admin/imoveis');
  redirect('/admin/imoveis');
}

export async function bulkDeleteImoveisAction(
  _: BulkDeleteImoveisState,
  formData: FormData,
): Promise<BulkDeleteImoveisState> {
  await requireAdmin();

  const confirmation = String(formData.get('confirmation') ?? '').trim();

  if (confirmation !== 'eu qro remover todos os imovies') {
    return {
      error: 'Digite exatamente "eu qro remover todos os imovies" para confirmar.',
    };
  }

  await deleteAllImoveis();
  revalidatePath('/admin/imoveis');
  redirect('/admin/imoveis');
}

function parseImovelFormData(formData: FormData) {
  const dataPrimeiroLeilao = normalizeOptionalString(formData.get('data_primeiro_leilao'));
  const valorPrimeiroLeilao = parseOptionalNumber(formData.get('valor_primeiro_leilao'));
  const dataSegundoLeilao = normalizeOptionalString(formData.get('data_segundo_leilao'));
  const valorSegundoLeilao = parseOptionalNumber(formData.get('valor_segundo_leilao'));

  return {
    titulo: String(formData.get('titulo') ?? '').trim(),
    descricao: String(formData.get('descricao') ?? '').trim(),
    tipo_leilao: String(formData.get('tipo_leilao') ?? '').trim(),
    tipo_propriedade: String(formData.get('tipo_propriedade') ?? '').trim(),
    valor_avaliacao: Number(formData.get('valor_avaliacao') ?? 0),
    valor_minimo: valorPrimeiroLeilao ?? 0,
    data_primeiro_leilao: dataPrimeiroLeilao,
    valor_primeiro_leilao: valorPrimeiroLeilao,
    data_segundo_leilao: dataSegundoLeilao,
    valor_segundo_leilao: valorSegundoLeilao,
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
    data_leilao: dataPrimeiroLeilao,
    status: String(formData.get('status') ?? '').trim(),
    destaque: formData.get('destaque') === 'on',
    ordem_destaque: parseOptionalInteger(formData.get('ordem_destaque')),
  };
}

function parseImovelDetalhesFormData(formData: FormData) {
  return {
    resumo_executivo: String(formData.get('resumo_executivo') ?? '').trim(),
    ocupacao: String(formData.get('ocupacao') ?? '').trim(),
    matricula: String(formData.get('matricula') ?? '').trim(),
    cartorio: String(formData.get('cartorio') ?? '').trim(),
    numero_processo: String(formData.get('numero_processo') ?? '').trim(),
    valor_mercado: parseOptionalNumber(formData.get('valor_mercado')),
    lance_recomendado: parseOptionalNumber(formData.get('lance_recomendado')),
    lucro_estimado: parseOptionalNumber(formData.get('lucro_estimado')),
    roi_estimado: parseOptionalNumber(formData.get('roi_estimado')),
    divida_iptu: parseOptionalNumber(formData.get('divida_iptu')),
    divida_condominio: parseOptionalNumber(formData.get('divida_condominio')),
    analise: String(formData.get('analise') ?? '').trim(),
    riscos: String(formData.get('riscos') ?? '').trim(),
    observacoes_juridicas: String(formData.get('observacoes_juridicas') ?? '').trim(),
    estrategia: String(formData.get('estrategia') ?? '').trim(),
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

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? '').trim();
  return rawValue || null;
}
