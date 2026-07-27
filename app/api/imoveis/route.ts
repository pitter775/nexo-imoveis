import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuthenticatedUser } from '@/lib/auth';
import { getPublicAbsoluteUrl } from '@/lib/site';
import { createAdminClient } from '@/lib/supabase/admin';

const IMOVEL_SELECT =
  'id, titulo, descricao, tipo_leilao, tipo_propriedade, valor_avaliacao, valor_minimo, data_primeiro_leilao, valor_primeiro_leilao, data_segundo_leilao, valor_segundo_leilao, quartos, banheiros, area_total, area_construida, ano_construcao, rua, numero, complemento, cidade, estado, cep, data_leilao, status, destaque, ordem_destaque, created_at';

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.trunc(parsed);
}

function parsePagination(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shouldPaginate =
    searchParams.has('limit') ||
    searchParams.has('page') ||
    searchParams.has('offset');

  if (!shouldPaginate) {
    return null;
  }

  const limit = Math.min(parsePositiveInteger(searchParams.get('limit'), 12), 100);
  const page = parsePositiveInteger(searchParams.get('page'), 1);
  const offset = searchParams.has('offset')
    ? Math.max(parsePositiveInteger(searchParams.get('offset'), 1) - 1, 0)
    : (page - 1) * limit;

  return {
    limit,
    offset,
    page: Math.floor(offset / limit) + 1,
  };
}

function calculateDiscount(
  auctionPrice: number,
  valuationPrice: number | null,
  firstAuctionPrice: number | null,
) {
  const basis = valuationPrice ?? firstAuctionPrice;

  if (!basis || basis <= 0 || auctionPrice <= 0 || auctionPrice >= basis) {
    return {
      discount_percent: null,
      discount_basis_label: null,
    };
  }

  return {
    discount_percent: Math.round(((basis - auctionPrice) / basis) * 100),
    discount_basis_label: valuationPrice != null ? 'sobre avaliação' : 'sobre 1ª praça',
  };
}

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const currentUser = await getCurrentAuthenticatedUser();
  const pagination = parsePagination(request);

  let imoveisQuery = supabase
    .from('imoveis')
    .select(IMOVEL_SELECT, { count: pagination ? 'exact' : undefined })
    .order('created_at', { ascending: false, nullsFirst: false });

  if (pagination) {
    imoveisQuery = imoveisQuery.range(
      pagination.offset,
      pagination.offset + pagination.limit - 1,
    );
  }

  const { data: imoveis, error: imoveisError, count } = await imoveisQuery;

  if (imoveisError) {
    return NextResponse.json(
      { error: `Failed to load properties: ${imoveisError.message}` },
      { status: 500 },
    );
  }

  const imovelIds = (imoveis ?? []).map((imovel) => imovel.id);

  if (imovelIds.length === 0) {
    return NextResponse.json({
      properties: [],
      ...(pagination
        ? {
            pagination: {
              page: pagination.page,
              limit: pagination.limit,
              offset: pagination.offset,
              total: count ?? 0,
              total_pages: 0,
              has_more: false,
            },
          }
        : {}),
    });
  }

  const [
    { data: imagens, error: imagensError },
    { data: detalhes, error: detalhesError },
    { data: arquivos, error: arquivosError },
  ] =
    await Promise.all([
      supabase
        .from('imovel_imagens')
        .select('imovel_id, url, ordem')
        .in('imovel_id', imovelIds)
        .order('ordem', { ascending: true }),
      supabase
        .from('imovel_detalhes')
        .select(
          'imovel_id, resumo_executivo, ocupacao, matricula, cartorio, numero_processo, valor_mercado, lance_recomendado, lucro_estimado, roi_estimado, divida_iptu, divida_condominio, analise, riscos, observacoes_juridicas, estrategia',
        )
        .in('imovel_id', imovelIds),
      supabase
        .from('imovel_arquivos')
        .select(
          'id, imovel_id, nome_arquivo, url_storage, tipo_arquivo, tipo_documento, visivel_publico, visivel_pagantes, created_at',
        )
        .in('imovel_id', imovelIds)
        .order('created_at', { ascending: false }),
    ]);

  if (imagensError) {
    return NextResponse.json(
      { error: `Failed to load property images: ${imagensError.message}` },
      { status: 500 },
    );
  }

  if (detalhesError) {
    return NextResponse.json(
      { error: `Failed to load property dossier: ${detalhesError.message}` },
      { status: 500 },
    );
  }

  if (arquivosError) {
    return NextResponse.json(
      { error: `Failed to load property files: ${arquivosError.message}` },
      { status: 500 },
    );
  }

  const imagensPorImovel = new Map<string, string[]>();
  const detalhesPorImovel = new Map<string, (typeof detalhes)[number]>();
  const arquivosPorImovel = new Map<string, (typeof arquivos)>();
  const premiumAccessByImovelId = new Set<string>();
  const isAdmin = currentUser?.tipo_usuario === 'admin';

  if (currentUser && !isAdmin) {
    const { data: accesses, error: accessError } = await supabase
      .from('user_access')
      .select('imovel_id, data_expiracao, status')
      .eq('user_id', currentUser.id)
      .eq('status', 'ativo')
      .in('imovel_id', imovelIds);

    if (accessError) {
      return NextResponse.json(
        { error: `Failed to load property access: ${accessError.message}` },
        { status: 500 },
      );
    }

    const now = new Date();

    for (const access of accesses ?? []) {
      if (!access.imovel_id) {
        continue;
      }

      if (!access.data_expiracao || new Date(access.data_expiracao) > now) {
        premiumAccessByImovelId.add(access.imovel_id);
      }
    }
  }

  for (const imagem of imagens ?? []) {
    const currentImages = imagensPorImovel.get(imagem.imovel_id) ?? [];
    currentImages.push(imagem.url);
    imagensPorImovel.set(imagem.imovel_id, currentImages);
  }

  for (const detalhe of detalhes ?? []) {
    detalhesPorImovel.set(detalhe.imovel_id, detalhe);
  }

  for (const arquivo of arquivos ?? []) {
    const currentFiles = arquivosPorImovel.get(arquivo.imovel_id ?? '') ?? [];
    currentFiles.push(arquivo);
    arquivosPorImovel.set(arquivo.imovel_id ?? '', currentFiles);
  }

  const properties = (imoveis ?? []).map((imovel) => {
    const propertyUrl = getPublicAbsoluteUrl(`/imoveis/${imovel.id}`);
    const gallery = imagensPorImovel.get(imovel.id) ?? [];
    const imageUrl =
      gallery[0] ??
      `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000`;
    const publicAuctionPrice = Number(
      imovel.valor_segundo_leilao ??
        imovel.valor_primeiro_leilao ??
        imovel.valor_minimo ??
        imovel.valor_avaliacao ??
        0,
    );
    const publicAuctionDate =
      imovel.data_segundo_leilao ??
      imovel.data_primeiro_leilao ??
      imovel.data_leilao;
    const valuationPrice =
      imovel.valor_avaliacao == null ? null : Number(imovel.valor_avaliacao);
    const firstAuctionPrice =
      imovel.valor_primeiro_leilao == null ? null : Number(imovel.valor_primeiro_leilao);
    const discount = calculateDiscount(
      publicAuctionPrice,
      valuationPrice,
      firstAuctionPrice,
    );
    const hasPremiumAccess = isAdmin || premiumAccessByImovelId.has(imovel.id);
    const visibleFiles = (arquivosPorImovel.get(imovel.id) ?? []).filter((arquivo) =>
      hasPremiumAccess ? arquivo.visivel_pagantes !== false : arquivo.visivel_publico === true,
    );

    return {
      id: imovel.id,
      property_url: propertyUrl,
      link_imovel: propertyUrl,
      title: imovel.titulo,
      description: imovel.descricao ?? 'Sem descricao cadastrada.',
      destaque: Boolean(imovel.destaque),
      ordem_destaque: imovel.ordem_destaque,
      price: publicAuctionPrice,
      valuation_price: valuationPrice,
      discount_percent: discount.discount_percent,
      discount_basis_label: discount.discount_basis_label,
      has_premium_access: hasPremiumAccess,
      location: [imovel.cidade, imovel.estado].filter(Boolean).join(' - '),
      city: imovel.cidade,
      state: imovel.estado,
      address: [imovel.rua, imovel.numero, imovel.complemento]
        .filter(Boolean)
        .join(', '),
      type: imovel.tipo_propriedade ?? 'Imovel',
      auction_type: imovel.tipo_leilao ?? 'Nao informado',
      auction_date: publicAuctionDate,
      status: imovel.status ?? 'ativo',
      sqft: imovel.area_total == null ? null : Number(imovel.area_total),
      built_area:
        imovel.area_construida == null ? null : Number(imovel.area_construida),
      beds: imovel.quartos,
      baths: imovel.banheiros,
      year_built: imovel.ano_construcao,
      image_url: imageUrl,
      images: gallery,
      created_at: imovel.created_at,
      cep: imovel.cep,
      dossier: hasPremiumAccess ? detalhesPorImovel.get(imovel.id) ?? null : null,
      dossier_files: visibleFiles,
    };
  });

  return NextResponse.json({
    properties,
    ...(pagination
      ? {
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            offset: pagination.offset,
            total: count ?? properties.length,
            total_pages: Math.ceil((count ?? properties.length) / pagination.limit),
            has_more: pagination.offset + properties.length < (count ?? properties.length),
          },
        }
      : {}),
  });
}
