import { NextRequest, NextResponse } from 'next/server';
import { getAbsoluteUrl } from '@/lib/site';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toNumber(value: number | null) {
  return value == null ? null : Number(value);
}

function createNotFoundResponse() {
  return NextResponse.json(
    { erro: 'Im\u00f3vel n\u00e3o encontrado' },
    { status: 404 },
  );
}

function getFutureAuthToken(request: NextRequest) {
  // Reserved for future token-based auth without changing the route contract.
  return request.headers.get('authorization');
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    return createNotFoundResponse();
  }

  void getFutureAuthToken(request);

  const supabase = createAdminClient();

  try {
    const { data: imovel, error: imovelError } = await supabase
      .from('imoveis')
      .select(
        'id, titulo, descricao, cidade, estado, tipo_leilao, valor_avaliacao, valor_minimo, data_primeiro_leilao, valor_primeiro_leilao, data_segundo_leilao, valor_segundo_leilao, data_leilao, status, rua, numero, complemento, cep, tipo_propriedade, quartos, banheiros, area_total, area_construida, ano_construcao',
      )
      .eq('id', id)
      .maybeSingle();

    if (imovelError) {
      throw imovelError;
    }

    if (!imovel) {
      return createNotFoundResponse();
    }

    const [
      { data: detalhes, error: detalhesError },
      { data: imagens, error: imagensError },
      { data: arquivos, error: arquivosError },
      { data: leilao, error: leilaoError },
    ] = await Promise.all([
      supabase
        .from('imovel_detalhes')
        .select(
          'resumo_executivo, ocupacao, matricula, cartorio, valor_mercado, lance_recomendado, lucro_estimado, roi_estimado, analise, riscos, observacoes_juridicas, estrategia',
        )
        .eq('imovel_id', id)
        .maybeSingle(),
      supabase
        .from('imovel_imagens')
        .select('url, ordem')
        .eq('imovel_id', id)
        .order('ordem', { ascending: true }),
      supabase
        .from('imovel_arquivos')
        .select('nome_arquivo, url_storage, tipo_arquivo')
        .eq('imovel_id', id)
        .eq('visivel_publico', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('leiloes')
        .select('data_inicio, data_fim, valor_inicial, status')
        .eq('imovel_id', id)
        .order('data_inicio', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (detalhesError || imagensError || arquivosError || leilaoError) {
      throw detalhesError ?? imagensError ?? arquivosError ?? leilaoError;
    }

    const publicAuctionPrice =
      imovel.valor_segundo_leilao ??
      imovel.valor_primeiro_leilao ??
      imovel.valor_minimo;
    const publicAuctionDate =
      imovel.data_segundo_leilao ??
      imovel.data_primeiro_leilao ??
      imovel.data_leilao;

    return NextResponse.json({
      id: imovel.id,
      link_imovel: getAbsoluteUrl(`/imoveis/${imovel.id}`),
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
        resumo_executivo: detalhes?.resumo_executivo ?? null,
        ocupacao: detalhes?.ocupacao ?? null,
        matricula: detalhes?.matricula ?? null,
        cartorio: detalhes?.cartorio ?? null,
        valor_mercado: toNumber(detalhes?.valor_mercado ?? null),
        lance_recomendado: toNumber(detalhes?.lance_recomendado ?? null),
        lucro_estimado: toNumber(detalhes?.lucro_estimado ?? null),
        roi_estimado: toNumber(detalhes?.roi_estimado ?? null),
        analise: detalhes?.analise ?? null,
        riscos: detalhes?.riscos ?? null,
        observacoes_juridicas: detalhes?.observacoes_juridicas ?? null,
        estrategia: detalhes?.estrategia ?? null,
      },
      imagens: (imagens ?? []).map((imagem) => ({
        url: imagem.url,
        ordem: imagem.ordem ?? 0,
      })),
      arquivos_publicos: (arquivos ?? []).map((arquivo) => ({
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
    });
  } catch (error) {
    console.error('Erro ao buscar im\u00f3vel publico', error);
    return NextResponse.json(
      { erro: 'Erro ao buscar im\u00f3vel' },
      { status: 500 },
    );
  }
}
