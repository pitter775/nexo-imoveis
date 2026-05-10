import { NextRequest, NextResponse } from 'next/server';
import { getPublicAbsoluteUrl } from '@/lib/site';
import { createAdminClient } from '@/lib/supabase/admin';

function toNumber(value: number | null | undefined) {
  return value == null ? null : Number(value);
}

function parseLimit(value: string | null) {
  const limit = Number(value ?? 5);

  if (!Number.isFinite(limit)) {
    return 5;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 20);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const titulo = searchParams.get('titulo')?.trim() ?? searchParams.get('q')?.trim();
  const limit = parseLimit(searchParams.get('limit'));

  if (!titulo) {
    return NextResponse.json(
      { erro: 'Informe o parametro titulo para buscar o imovel.' },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  try {
    const { data: imoveis, error: imoveisError } = await supabase
      .from('imoveis')
      .select(
        'id, titulo, descricao, cidade, estado, tipo_leilao, valor_avaliacao, valor_minimo, data_primeiro_leilao, valor_primeiro_leilao, data_segundo_leilao, valor_segundo_leilao, data_leilao, status, rua, numero, complemento, cep, tipo_propriedade, quartos, banheiros, area_total, area_construida, ano_construcao, created_at',
      )
      .ilike('titulo', `%${titulo}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (imoveisError) {
      throw imoveisError;
    }

    const imovelIds = (imoveis ?? []).map((imovel) => imovel.id);

    if (imovelIds.length === 0) {
      return NextResponse.json({
        busca: titulo,
        total: 0,
        imoveis: [],
      });
    }

    const [
      { data: detalhes, error: detalhesError },
      { data: imagens, error: imagensError },
      { data: arquivos, error: arquivosError },
      { data: leiloes, error: leiloesError },
    ] = await Promise.all([
      supabase
        .from('imovel_detalhes')
        .select(
          'imovel_id, resumo_executivo, ocupacao, matricula, cartorio, valor_mercado, lance_recomendado, lucro_estimado, roi_estimado, analise, riscos, observacoes_juridicas, estrategia',
        )
        .in('imovel_id', imovelIds),
      supabase
        .from('imovel_imagens')
        .select('imovel_id, url, ordem')
        .in('imovel_id', imovelIds)
        .order('ordem', { ascending: true }),
      supabase
        .from('imovel_arquivos')
        .select('imovel_id, nome_arquivo, url_storage, tipo_arquivo')
        .in('imovel_id', imovelIds)
        .eq('visivel_publico', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('leiloes')
        .select('imovel_id, data_inicio, data_fim, valor_inicial, status, created_at')
        .in('imovel_id', imovelIds)
        .order('data_inicio', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }),
    ]);

    if (detalhesError || imagensError || arquivosError || leiloesError) {
      throw detalhesError ?? imagensError ?? arquivosError ?? leiloesError;
    }

    const detalhesPorImovel = new Map((detalhes ?? []).map((item) => [item.imovel_id, item]));
    const imagensPorImovel = new Map<string, { url: string; ordem: number | null }[]>();
    const arquivosPorImovel = new Map<
      string,
      { nome_arquivo: string | null; url_storage: string | null; tipo_arquivo: string | null }[]
    >();
    const leilaoPorImovel = new Map<string, (typeof leiloes)[number]>();

    for (const imagem of imagens ?? []) {
      const current = imagensPorImovel.get(imagem.imovel_id) ?? [];
      current.push({ url: imagem.url, ordem: imagem.ordem ?? 0 });
      imagensPorImovel.set(imagem.imovel_id, current);
    }

    for (const arquivo of arquivos ?? []) {
      if (!arquivo.imovel_id) {
        continue;
      }

      const current = arquivosPorImovel.get(arquivo.imovel_id) ?? [];
      current.push(arquivo);
      arquivosPorImovel.set(arquivo.imovel_id, current);
    }

    for (const leilao of leiloes ?? []) {
      if (!leilao.imovel_id) {
        continue;
      }

      if (!leilaoPorImovel.has(leilao.imovel_id)) {
        leilaoPorImovel.set(leilao.imovel_id, leilao);
      }
    }

    const formattedImoveis = (imoveis ?? []).map((imovel) => {
      const detalhe = detalhesPorImovel.get(imovel.id);
      const leilao = leilaoPorImovel.get(imovel.id);
      const publicAuctionPrice =
        imovel.valor_segundo_leilao ??
        imovel.valor_primeiro_leilao ??
        imovel.valor_minimo;
      const publicAuctionDate =
        imovel.data_segundo_leilao ??
        imovel.data_primeiro_leilao ??
        imovel.data_leilao;

      return {
        id: imovel.id,
        link_imovel: getPublicAbsoluteUrl(`/imoveis/${imovel.id}`),
        titulo: imovel.titulo,
        descricao: imovel.descricao,
        cidade: imovel.cidade,
        estado: imovel.estado,
        tipo_leilao: imovel.tipo_leilao,
        valor_avaliacao: toNumber(imovel.valor_avaliacao),
        valor_minimo: toNumber(imovel.valor_minimo),
        valor_primeiro_leilao: toNumber(imovel.valor_primeiro_leilao),
        valor_segundo_leilao: toNumber(imovel.valor_segundo_leilao),
        valor_publico: toNumber(publicAuctionPrice),
        data_primeiro_leilao: imovel.data_primeiro_leilao,
        data_segundo_leilao: imovel.data_segundo_leilao,
        data_leilao: publicAuctionDate,
        status: imovel.status,
        endereco: {
          rua: imovel.rua,
          numero: imovel.numero,
          complemento: imovel.complemento,
          cep: imovel.cep,
        },
        caracteristicas: {
          tipo_propriedade: imovel.tipo_propriedade,
          quartos: imovel.quartos,
          banheiros: imovel.banheiros,
          area_total: toNumber(imovel.area_total),
          area_construida: toNumber(imovel.area_construida),
          ano_construcao: imovel.ano_construcao,
        },
        detalhes: {
          resumo_executivo: detalhe?.resumo_executivo ?? null,
          ocupacao: detalhe?.ocupacao ?? null,
          matricula: detalhe?.matricula ?? null,
          cartorio: detalhe?.cartorio ?? null,
          valor_mercado: toNumber(detalhe?.valor_mercado),
          lance_recomendado: toNumber(detalhe?.lance_recomendado),
          lucro_estimado: toNumber(detalhe?.lucro_estimado),
          roi_estimado: toNumber(detalhe?.roi_estimado),
          analise: detalhe?.analise ?? null,
          riscos: detalhe?.riscos ?? null,
          observacoes_juridicas: detalhe?.observacoes_juridicas ?? null,
          estrategia: detalhe?.estrategia ?? null,
        },
        imagens: imagensPorImovel.get(imovel.id) ?? [],
        arquivos_publicos: (arquivosPorImovel.get(imovel.id) ?? []).map((arquivo) => ({
          nome_arquivo: arquivo.nome_arquivo,
          url: arquivo.url_storage,
          tipo: arquivo.tipo_arquivo,
        })),
        leilao: leilao
          ? {
              data_inicio: leilao.data_inicio,
              data_fim: leilao.data_fim,
              valor_inicial: toNumber(leilao.valor_inicial),
              status: leilao.status,
            }
          : null,
      };
    });

    return NextResponse.json({
      busca: titulo,
      total: formattedImoveis.length,
      imoveis: formattedImoveis,
    });
  } catch (error) {
    console.error('Erro ao buscar imoveis por titulo', error);

    return NextResponse.json(
      { erro: 'Erro ao buscar imoveis por titulo.' },
      { status: 500 },
    );
  }
}
