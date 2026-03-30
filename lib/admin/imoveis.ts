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
  data_primeiro_leilao?: string | null;
  valor_primeiro_leilao?: number | null;
  data_segundo_leilao?: string | null;
  valor_segundo_leilao?: number | null;
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
  destaque: boolean;
  ordem_destaque: number | null;
  created_at?: string | null;
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

type ListImoveisPageInput = {
  page?: number;
  pageSize?: number;
  query?: string;
};

export type ListImoveisPageResult = {
  imoveis: ImovelRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: string;
};

export async function listImoveisPage({
  page = 1,
  pageSize = 20,
  query = '',
}: ListImoveisPageInput = {}): Promise<ListImoveisPageResult> {
  const supabase = createAdminClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const normalizedQuery = query.trim();
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let request = supabase
    .from('imoveis')
    .select(
      'id, titulo, descricao, tipo_leilao, tipo_propriedade, valor_avaliacao, valor_minimo, data_primeiro_leilao, valor_primeiro_leilao, data_segundo_leilao, valor_segundo_leilao, quartos, banheiros, area_total, area_construida, ano_construcao, rua, numero, complemento, cidade, estado, cep, data_leilao, status, destaque, ordem_destaque, created_at',
      { count: 'exact' },
    )
    .order('data_leilao', { ascending: true })
    .range(from, to);

  if (normalizedQuery) {
    const escapedQuery = normalizedQuery.replace(/[%_]/g, '');
    request = request.or(
      [
        `titulo.ilike.%${escapedQuery}%`,
        `descricao.ilike.%${escapedQuery}%`,
        `cidade.ilike.%${escapedQuery}%`,
        `estado.ilike.%${escapedQuery}%`,
        `tipo_leilao.ilike.%${escapedQuery}%`,
        `status.ilike.%${escapedQuery}%`,
      ].join(','),
    );
  }

  const { data, error, count } = await request;

  if (error) {
    throw new Error(`Failed to list imoveis: ${error.message}`);
  }

  const imoveis = ((data ?? []) as ImovelRecord[]).map((imovel) => ({
    ...imovel,
    capa_url: null,
  }));

  if (imoveis.length === 0) {
    return {
      imoveis,
      total: count ?? 0,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / safePageSize)),
      query: normalizedQuery,
    };
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

  const imoveisWithCover = imoveis.map((imovel) => ({
    ...imovel,
    capa_url: coverByImovelId.get(imovel.id) ?? null,
  }));

  const total = count ?? 0;

  return {
    imoveis: imoveisWithCover,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    query: normalizedQuery,
  };
}

export async function listImoveis() {
  const result = await listImoveisPage({ page: 1, pageSize: 9999 });
  return result.imoveis;
}

export async function getImovelById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('imoveis')
    .select(
      'id, titulo, descricao, tipo_leilao, tipo_propriedade, valor_avaliacao, valor_minimo, data_primeiro_leilao, valor_primeiro_leilao, data_segundo_leilao, valor_segundo_leilao, quartos, banheiros, area_total, area_construida, ano_construcao, rua, numero, complemento, cidade, estado, cep, data_leilao, status, destaque, ordem_destaque, created_at',
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
  const { data, error } = await supabase
    .from('imoveis')
    .insert(input)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create imovel: ${error.message}`);
  }

  return data.id as string;
}

export async function updateImovel(id: string, input: Omit<ImovelRecord, 'id'>) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('imoveis').update(input).eq('id', id);

  if (error) {
    throw new Error(`Failed to update imovel: ${error.message}`);
  }
}

export async function updateImovelStatus(id: string, status: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('imoveis')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update imovel status: ${error.message}`);
  }
}

export async function deleteImovel(id: string) {
  await deleteImoveis([id]);
}

export async function deleteAllImoveis() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('imoveis').select('id');

  if (error) {
    throw new Error(`Failed to load imoveis for bulk delete: ${error.message}`);
  }

  const imovelIds = (data ?? [])
    .map((imovel) => imovel.id)
    .filter((imovelId): imovelId is string => Boolean(imovelId));

  if (imovelIds.length === 0) {
    return;
  }

  await deleteImoveis(imovelIds);
}

async function deleteImoveis(ids: string[]) {
  if (ids.length === 0) {
    return;
  }

  const supabase = createAdminClient();

  const [{ data: imagens, error: imagensError }, { data: arquivos, error: arquivosError }] =
    await Promise.all([
      supabase.from('imovel_imagens').select('url').in('imovel_id', ids),
      supabase.from('imovel_arquivos').select('id, url_storage').in('imovel_id', ids),
    ]);

  if (imagensError) {
    throw new Error(`Failed to load imovel images: ${imagensError.message}`);
  }

  if (arquivosError) {
    throw new Error(`Failed to load imovel files: ${arquivosError.message}`);
  }

  const arquivoIds = (arquivos ?? [])
    .map((arquivo) => arquivo.id)
    .filter((arquivoId): arquivoId is string => Boolean(arquivoId));

  if (arquivoIds.length > 0) {
    const { error } = await supabase
      .from('imovel_arquivo_extracoes')
      .delete()
      .in('arquivo_id', arquivoIds);

    if (error) {
      throw new Error(`Failed to remove imovel file extractions: ${error.message}`);
    }
  }

  const { data: conversas, error: conversasError } = await supabase
    .from('chat_conversas')
    .select('id')
    .in('imovel_id', ids);

  if (conversasError) {
    throw new Error(`Failed to load imovel chats: ${conversasError.message}`);
  }

  const conversaIds = (conversas ?? [])
    .map((conversa) => conversa.id)
    .filter((conversaId): conversaId is string => Boolean(conversaId));

  if (conversaIds.length > 0) {
    const { error: mensagensError } = await supabase
      .from('chat_mensagens')
      .delete()
      .in('conversa_id', conversaIds);

    if (mensagensError) {
      throw new Error(`Failed to remove imovel chat messages: ${mensagensError.message}`);
    }
  }

  const cleanupTasks = [
    supabase.from('chat_conversas').delete().in('imovel_id', ids),
    supabase.from('historico_acessos').delete().in('imovel_id', ids),
    supabase.from('leiloes').delete().in('imovel_id', ids),
    supabase.from('pagamentos_itens').delete().in('imovel_id', ids),
    supabase.from('user_access').delete().in('imovel_id', ids),
    supabase.from('imovel_detalhes').delete().in('imovel_id', ids),
    supabase.from('imovel_imagens').delete().in('imovel_id', ids),
    supabase.from('imovel_arquivos').delete().in('imovel_id', ids),
  ] as const;

  const results = await Promise.all(cleanupTasks);
  const failedCleanup = results.find((result) => result.error);

  if (failedCleanup?.error) {
    throw new Error(`Failed to cleanup imovel relations: ${failedCleanup.error.message}`);
  }

  const storagePaths = [
    ...(imagens ?? [])
      .map((imagem) => extractStoragePath(imagem.url))
      .filter((path): path is string => Boolean(path)),
    ...(arquivos ?? [])
      .map((arquivo) => extractStoragePath(arquivo.url_storage ?? null))
      .filter((path): path is string => Boolean(path)),
  ];

  if (storagePaths.length > 0) {
    for (const chunk of chunkArray(storagePaths, 100)) {
      await supabase.storage.from('imoveis').remove(chunk);
    }
  }

  const { error } = await supabase.from('imoveis').delete().in('id', ids);

  if (error) {
    throw new Error(`Failed to delete imovel: ${error.message}`);
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

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}
