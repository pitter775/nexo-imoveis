import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type ImovelRecord = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo_leilao: string | null;
  tipo_propriedade: string | null;
  valor_avaliacao: number | null;
  valor_minimo: number | null;
  quartos: number | null;
  banheiros: number | null;
  area_total: number | null;
  area_construida: number | null;
  ano_construcao: number | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  data_leilao: string | null;
  status: string | null;
  capa_url?: string | null;
};

export type ImovelImagemRecord = {
  imovel_id: string;
  url: string;
  ordem: number | null;
};

export type ImovelDetalhesRecord = {
  id: string;
  imovel_id: string;
  resumo_executivo: string | null;
  ocupacao: string | null;
  matricula: string | null;
  cartorio: string | null;
  numero_processo: string | null;
  valor_mercado: number | null;
  lance_recomendado: number | null;
  lucro_estimado: number | null;
  roi_estimado: number | null;
  divida_iptu: number | null;
  divida_condominio: number | null;
  analise: string | null;
  riscos: string | null;
  observacoes_juridicas: string | null;
  estrategia: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ImovelArquivoRecord = {
  id: string;
  imovel_id: string | null;
  nome_arquivo: string | null;
  url_storage: string | null;
  tipo_arquivo: string | null;
  tipo_documento: string | null;
  visivel_publico: boolean | null;
  visivel_pagantes: boolean | null;
  created_at: string | null;
};

export async function listImoveis() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('imoveis')
    .select(
      'id, titulo, descricao, tipo_leilao, tipo_propriedade, valor_avaliacao, valor_minimo, quartos, banheiros, area_total, area_construida, ano_construcao, rua, numero, complemento, cidade, estado, cep, data_leilao, status',
    )
    .order('data_leilao', { ascending: true });

  if (error) {
    throw new Error(`Failed to list imoveis: ${error.message}`);
  }

  const imoveis = ((data ?? []) as ImovelRecord[]).map((imovel) => ({
    ...imovel,
    capa_url: null,
  }));

  if (imoveis.length === 0) {
    return imoveis;
  }

  const { data: imagens, error: imagesError } = await supabase
    .from('imovel_imagens')
    .select('imovel_id, url, ordem')
    .in(
      'imovel_id',
      imoveis.map((imovel) => imovel.id),
    )
    .order('ordem', { ascending: true });

  if (imagesError) {
    throw new Error(`Failed to list imovel images: ${imagesError.message}`);
  }

  const coverByImovelId = new Map<string, string>();

  for (const imagem of (imagens ?? []) as ImovelImagemRecord[]) {
    if (!coverByImovelId.has(imagem.imovel_id)) {
      coverByImovelId.set(imagem.imovel_id, imagem.url);
    }
  }

  return imoveis.map((imovel) => ({
    ...imovel,
    capa_url: coverByImovelId.get(imovel.id) ?? null,
  }));
}

export async function getImovelById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('imoveis')
    .select(
      'id, titulo, descricao, tipo_leilao, tipo_propriedade, valor_avaliacao, valor_minimo, quartos, banheiros, area_total, area_construida, ano_construcao, rua, numero, complemento, cidade, estado, cep, data_leilao, status',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch imovel: ${error.message}`);
  }

  return (data as ImovelRecord | null) ?? null;
}

export async function createImovel(input: Omit<ImovelRecord, 'id'>) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('imoveis').insert(input);

  if (error) {
    throw new Error(`Failed to create imovel: ${error.message}`);
  }
}

export async function updateImovel(id: string, input: Omit<ImovelRecord, 'id'>) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('imoveis').update(input).eq('id', id);

  if (error) {
    throw new Error(`Failed to update imovel: ${error.message}`);
  }
}

export async function listImovelImages(imovelId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('imovel_imagens')
    .select('imovel_id, url, ordem')
    .eq('imovel_id', imovelId)
    .order('ordem', { ascending: true });

  if (error) {
    throw new Error(`Failed to list imovel images: ${error.message}`);
  }

  return (data ?? []) as ImovelImagemRecord[];
}

export async function getImovelDetalhes(imovelId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('imovel_detalhes')
    .select(
      'id, imovel_id, resumo_executivo, ocupacao, matricula, cartorio, numero_processo, valor_mercado, lance_recomendado, lucro_estimado, roi_estimado, divida_iptu, divida_condominio, analise, riscos, observacoes_juridicas, estrategia, created_at, updated_at',
    )
    .eq('imovel_id', imovelId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch imovel details: ${error.message}`);
  }

  return (data as ImovelDetalhesRecord | null) ?? null;
}

export async function upsertImovelDetalhes(
  imovelId: string,
  input: Omit<ImovelDetalhesRecord, 'id' | 'imovel_id' | 'created_at' | 'updated_at'>,
) {
  const supabase = createAdminClient();
  const payload = {
    imovel_id: imovelId,
    ...input,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('imovel_detalhes')
    .upsert(payload, { onConflict: 'imovel_id' });

  if (error) {
    throw new Error(`Failed to save imovel details: ${error.message}`);
  }
}

export async function listImovelArquivos(imovelId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('imovel_arquivos')
    .select(
      'id, imovel_id, nome_arquivo, url_storage, tipo_arquivo, tipo_documento, visivel_publico, visivel_pagantes, created_at',
    )
    .eq('imovel_id', imovelId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list imovel files: ${error.message}`);
  }

  return (data ?? []) as ImovelArquivoRecord[];
}

export async function addImovelArquivo(
  imovelId: string,
  input: Omit<ImovelArquivoRecord, 'id' | 'imovel_id' | 'created_at'>,
) {
  const supabase = createAdminClient();
  const payload = {
    imovel_id: imovelId,
    ...input,
  };

  const { data, error } = await supabase
    .from('imovel_arquivos')
    .insert(payload)
    .select(
      'id, imovel_id, nome_arquivo, url_storage, tipo_arquivo, tipo_documento, visivel_publico, visivel_pagantes, created_at',
    )
    .single();

  if (error) {
    throw new Error(`Failed to save imovel file: ${error.message}`);
  }

  return data as ImovelArquivoRecord;
}

export async function removeImovelArquivo(imovelId: string, arquivoId: string) {
  const supabase = createAdminClient();

  const { data: arquivo, error: selectError } = await supabase
    .from('imovel_arquivos')
    .select('id, url_storage')
    .eq('imovel_id', imovelId)
    .eq('id', arquivoId)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Failed to fetch imovel file: ${selectError.message}`);
  }

  const { error } = await supabase
    .from('imovel_arquivos')
    .delete()
    .eq('imovel_id', imovelId)
    .eq('id', arquivoId);

  if (error) {
    throw new Error(`Failed to remove imovel file: ${error.message}`);
  }

  const storagePath = extractStoragePath(arquivo?.url_storage ?? null);

  if (storagePath) {
    await supabase.storage.from('imoveis').remove([storagePath]);
  }
}

export async function addImovelImage(imovelId: string, url: string) {
  const supabase = createAdminClient();

  const { data: existingImages, error: listError } = await supabase
    .from('imovel_imagens')
    .select('ordem')
    .eq('imovel_id', imovelId)
    .order('ordem', { ascending: false })
    .limit(1);

  if (listError) {
    throw new Error(`Failed to load next image order: ${listError.message}`);
  }

  const nextOrder = ((existingImages?.[0]?.ordem ?? 0) || 0) + 1;
  const payload = {
    imovel_id: imovelId,
    url,
    ordem: nextOrder,
  };

  const { error } = await supabase.from('imovel_imagens').insert(payload);

  if (error) {
    throw new Error(`Failed to save imovel image: ${error.message}`);
  }

  return payload satisfies ImovelImagemRecord;
}

export async function removeImovelImage(imovelId: string, url: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('imovel_imagens')
    .delete()
    .eq('imovel_id', imovelId)
    .eq('url', url);

  if (error) {
    throw new Error(`Failed to remove imovel image: ${error.message}`);
  }

  const storagePath = extractStoragePath(url);

  if (storagePath) {
    await supabase.storage.from('imoveis').remove([storagePath]);
  }
}

export async function reorderImovelImages(
  imovelId: string,
  urlsInOrder: string[],
) {
  const supabase = createAdminClient();

  for (const [index, url] of urlsInOrder.entries()) {
    const { error } = await supabase
      .from('imovel_imagens')
      .update({ ordem: index + 1 })
      .eq('imovel_id', imovelId)
      .eq('url', url);

    if (error) {
      throw new Error(`Failed to reorder imovel images: ${error.message}`);
    }
  }
}

function extractStoragePath(url: string | null) {
  if (!url) {
    return null;
  }

  const marker = '/storage/v1/object/public/imoveis/';
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return url.slice(markerIndex + marker.length);
}
