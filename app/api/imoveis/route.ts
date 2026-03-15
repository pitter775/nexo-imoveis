import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();

  const [
    { data: imoveis, error: imoveisError },
    { data: imagens, error: imagensError },
    { data: detalhes, error: detalhesError },
    { data: arquivos, error: arquivosError },
  ] =
    await Promise.all([
      supabase
        .from('imoveis')
        .select(
          'id, titulo, descricao, tipo_leilao, tipo_propriedade, valor_avaliacao, valor_minimo, quartos, banheiros, area_total, area_construida, ano_construcao, rua, numero, complemento, cidade, estado, cep, data_leilao, status, created_at',
        )
        .order('created_at', { ascending: false }),
      supabase
        .from('imovel_imagens')
        .select('imovel_id, url, ordem')
        .order('ordem', { ascending: true }),
      supabase
        .from('imovel_detalhes')
        .select(
          'imovel_id, resumo_executivo, ocupacao, matricula, cartorio, numero_processo, valor_mercado, lance_recomendado, lucro_estimado, roi_estimado, divida_iptu, divida_condominio, analise, riscos, observacoes_juridicas, estrategia',
        ),
      supabase
        .from('imovel_arquivos')
        .select(
          'id, imovel_id, nome_arquivo, url_storage, tipo_arquivo, tipo_documento, visivel_publico, visivel_pagantes, created_at',
        )
        .order('created_at', { ascending: false }),
    ]);

  if (imoveisError) {
    return NextResponse.json(
      { error: `Failed to load properties: ${imoveisError.message}` },
      { status: 500 },
    );
  }

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
    const gallery = imagensPorImovel.get(imovel.id) ?? [];
    const imageUrl =
      gallery[0] ??
      `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000`;

    return {
      id: imovel.id,
      title: imovel.titulo,
      description: imovel.descricao ?? 'Sem descricao cadastrada.',
      price: Number(imovel.valor_minimo ?? imovel.valor_avaliacao ?? 0),
      valuation_price:
        imovel.valor_avaliacao == null ? null : Number(imovel.valor_avaliacao),
      location: [imovel.cidade, imovel.estado].filter(Boolean).join(' - '),
      city: imovel.cidade,
      state: imovel.estado,
      address: [imovel.rua, imovel.numero, imovel.complemento]
        .filter(Boolean)
        .join(', '),
      type: imovel.tipo_propriedade ?? 'Imovel',
      auction_type: imovel.tipo_leilao ?? 'Nao informado',
      auction_date: imovel.data_leilao,
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
      dossier: detalhesPorImovel.get(imovel.id) ?? null,
      dossier_files: arquivosPorImovel.get(imovel.id) ?? [],
    };
  });

  return NextResponse.json({ properties });
}
