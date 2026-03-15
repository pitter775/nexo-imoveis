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

function extractStoragePath(url: string) {
  const marker = '/storage/v1/object/public/imoveis/';
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return url.slice(markerIndex + marker.length);
}
