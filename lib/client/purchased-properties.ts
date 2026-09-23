import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

type AccessRow = {
  id: string;
  imovel_id: string | null;
  data_compra: string | null;
  data_expiracao: string | null;
  status: string | null;
  created_at: string | null;
};

type ImovelRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  cidade: string | null;
  estado: string | null;
  tipo_propriedade: string | null;
  tipo_leilao: string | null;
  valor_avaliacao: number | null;
  valor_minimo: number | null;
  valor_primeiro_leilao: number | null;
  valor_segundo_leilao: number | null;
  data_primeiro_leilao: string | null;
  data_segundo_leilao: string | null;
  data_leilao: string | null;
  status: string | null;
};

type ImovelImageRow = {
  imovel_id: string | null;
  url: string;
  ordem: number | null;
};

export type PurchasedProperty = {
  accessId: string;
  imovelId: string;
  title: string;
  description: string;
  location: string;
  type: string;
  auctionType: string;
  price: number;
  auctionDate: string | null;
  imageUrl: string;
  accessStatus: string;
  purchasedAt: string | null;
  expiresAt: string | null;
};

export async function getPurchasedProperties(userId: string): Promise<PurchasedProperty[]> {
  const supabase = createAdminClient();
  const { data: accesses, error: accessError } = await supabase
    .from('user_access')
    .select('id, imovel_id, data_compra, data_expiracao, status, created_at')
    .eq('user_id', userId)
    .eq('status', 'ativo')
    .order('created_at', { ascending: false, nullsFirst: false });

  if (accessError) {
    throw new Error(`Failed to load purchased properties: ${accessError.message}`);
  }

  const validAccesses = ((accesses ?? []) as AccessRow[]).filter(
    (access) => access.imovel_id && isAccessActive(access),
  );
  const imovelIds = Array.from(new Set(validAccesses.map((access) => access.imovel_id as string)));

  if (imovelIds.length === 0) {
    return [];
  }

  const [imoveisResponse, imagensResponse] = await Promise.all([
    supabase
      .from('imoveis')
      .select(
        'id, titulo, descricao, cidade, estado, tipo_propriedade, tipo_leilao, valor_avaliacao, valor_minimo, valor_primeiro_leilao, valor_segundo_leilao, data_primeiro_leilao, data_segundo_leilao, data_leilao, status',
      )
      .in('id', imovelIds),
    supabase
      .from('imovel_imagens')
      .select('imovel_id, url, ordem')
      .in('imovel_id', imovelIds)
      .order('ordem', { ascending: true }),
  ]);

  if (imoveisResponse.error) {
    throw new Error(`Failed to load properties: ${imoveisResponse.error.message}`);
  }

  if (imagensResponse.error) {
    throw new Error(`Failed to load property images: ${imagensResponse.error.message}`);
  }

  const imovelById = new Map(
    ((imoveisResponse.data ?? []) as ImovelRow[]).map((imovel) => [imovel.id, imovel]),
  );
  const imageByImovelId = new Map<string, string>();

  for (const image of (imagensResponse.data ?? []) as ImovelImageRow[]) {
    if (image.imovel_id && !imageByImovelId.has(image.imovel_id)) {
      imageByImovelId.set(image.imovel_id, image.url);
    }
  }

  return validAccesses
    .map((access) => {
      const imovelId = access.imovel_id as string;
      const imovel = imovelById.get(imovelId);

      if (!imovel) {
        return null;
      }

      return {
        accessId: access.id,
        imovelId,
        title: imovel.titulo,
        description: imovel.descricao ?? 'Informações completas liberadas para consulta.',
        location: [imovel.cidade, imovel.estado].filter(Boolean).join(' - ') || 'Localização não informada',
        type: imovel.tipo_propriedade ?? 'Imóvel',
        auctionType: imovel.tipo_leilao ?? 'Leilão',
        price: Number(
          imovel.valor_segundo_leilao ??
            imovel.valor_primeiro_leilao ??
            imovel.valor_minimo ??
            imovel.valor_avaliacao ??
            0,
        ),
        auctionDate:
          imovel.data_segundo_leilao ??
          imovel.data_primeiro_leilao ??
          imovel.data_leilao,
        imageUrl:
          imageByImovelId.get(imovelId) ??
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000',
        accessStatus: access.status ?? 'ativo',
        purchasedAt: access.data_compra ?? access.created_at,
        expiresAt: access.data_expiracao,
      };
    })
    .filter((item): item is PurchasedProperty => Boolean(item));
}

function isAccessActive(access: AccessRow) {
  if (access.status !== 'ativo') {
    return false;
  }

  if (!access.data_expiracao) {
    return true;
  }

  return new Date(access.data_expiracao) > new Date();
}
