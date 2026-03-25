import 'server-only';

import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database, Json } from '@/lib/supabase/types';

const EXTRACTION_MODEL =
  process.env.OPENAI_EXTRACTION_MODEL ??
  process.env.OPENAI_CHAT_MODEL ??
  'gpt-4o-mini';

type ProcessPropertyDocumentInput = {
  arquivoId: string;
  propertyId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string | null;
  documentType?: string | null;
};

type ExtractionStatus =
  | 'pendente'
  | 'processando'
  | 'concluido'
  | 'erro'
  | 'ignorado';

type StructuredExtraction = {
  texto_base?: string;
  resumo_documento?: string;
  estrategia_extracao?: string;
  imovel?: Partial<{
    descricao: string | null;
    tipo_leilao: string | null;
    valor_avaliacao: number | null;
    valor_minimo: number | null;
    cidade: string | null;
    estado: string | null;
    data_leilao: string | null;
    status: string | null;
    rua: string | null;
    numero: string | null;
    complemento: string | null;
    cep: string | null;
    tipo_propriedade: string | null;
    quartos: number | null;
    banheiros: number | null;
    area_total: number | null;
    area_construida: number | null;
    ano_construcao: number | null;
  }>;
  detalhes?: Partial<{
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
  }>;
  campos_detectados?: Record<string, string | number | boolean | null>;
};

export async function processPropertyDocument(
  input: ProcessPropertyDocumentInput,
) {
  await upsertExtraction({
    arquivoId: input.arquivoId,
    propertyId: input.propertyId,
    status: 'processando',
    errorMessage: null,
  });

  try {
    if (!looksLikePdf(input.fileName, input.fileType)) {
      await upsertExtraction({
        arquivoId: input.arquivoId,
        propertyId: input.propertyId,
        status: 'ignorado',
        summary: 'Arquivo salvo sem processamento automatico porque nao e um PDF.',
        extractedFields: {
          motivo: 'arquivo_nao_pdf',
          nome_arquivo: input.fileName,
          tipo_documento: input.documentType ?? null,
        },
      });

      return { status: 'ignorado' as const };
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY nao configurada para leitura inteligente de PDF.');
    }

    const structured = await extractStructuredDataFromPdf({
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      documentType: input.documentType ?? null,
    });

    await applyStructuredUpdates(input.propertyId, structured);

    const fieldsPayload = {
      tipo_documento: input.documentType ?? null,
      nome_arquivo: input.fileName,
      estrategia_extracao:
        structured.estrategia_extracao ?? 'openai_pdf_input_file',
      ...(structured.campos_detectados ?? {}),
      ...(structured.imovel ? { imovel: structured.imovel } : {}),
      ...(structured.detalhes ? { detalhes: structured.detalhes } : {}),
    };

    await upsertExtraction({
      arquivoId: input.arquivoId,
      propertyId: input.propertyId,
      status: 'concluido',
      extractedText:
        structured.texto_base ??
        structured.resumo_documento ??
        'Documento processado via OpenAI.',
      summary:
        structured.resumo_documento ??
        'Documento processado automaticamente a partir do PDF enviado.',
      extractedFields: fieldsPayload,
      errorMessage: null,
    });

    return {
      status: 'concluido' as const,
      summary: structured.resumo_documento ?? null,
      extractedFields: fieldsPayload,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Falha inesperada ao processar o PDF.';

    await upsertExtraction({
      arquivoId: input.arquivoId,
      propertyId: input.propertyId,
      status: 'erro',
      errorMessage: message,
    });

    return {
      status: 'erro' as const,
      error: message,
    };
  }
}

async function extractStructuredDataFromPdf({
  fileUrl,
  fileName,
  documentType,
}: {
  fileUrl: string;
  fileName: string;
  documentType: string | null;
}): Promise<StructuredExtraction> {
  const client = createOpenAIClient();
  const response = await client.responses.create({
    model: EXTRACTION_MODEL,
    input: [
      {
        role: 'system',
        content: [
          'Voce extrai dados estruturados de documentos PDF sobre imoveis de leilao.',
          'Leia o PDF inteiro e identifique o maximo de informacoes confiaveis.',
          'Retorne apenas JSON valido, sem markdown.',
          'Nao invente nenhum valor.',
          'Se um campo nao estiver claramente presente, retorne null, exceto nos campos de inteligencia financeira permitidos abaixo.',
          'Para lance_recomendado, lucro_estimado, roi_estimado e analise, se esses campos nao estiverem explicitos no PDF mas houver dados suficientes no proprio documento para estimar ou redigir uma recomendacao coerente, voce deve cria-los a partir desses dados.',
          'Quando estimar esses campos, use apenas informacoes obtidas no documento, como valor minimo, valor de avaliacao, valor de mercado, debitos, ocupacao, riscos, liquidez, custos e contexto juridico.',
          'Se faltar base suficiente para uma estimativa confiavel, retorne null nesses campos.',
          'Corrija pequenos erros visuais do documento quando forem obvios.',
          'Use datas em formato ISO quando houver dia completo.',
          'Use numeros decimais sem simbolo monetario.',
          'Preencha textos longos de forma objetiva e util para o cadastro do imovel.',
          getDocumentSpecificInstructions(documentType),
        ].join(' '),
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: [
              `Arquivo: ${fileName}`,
              `Tipo de documento informado: ${documentType ?? 'nao informado'}`,
              '',
              'Retorne o JSON com esta estrutura:',
              JSON.stringify(
                {
                  texto_base: 'string|null',
                  resumo_documento: 'string|null',
                  estrategia_extracao: 'openai_pdf_input_file',
                  imovel: {
                    descricao: 'string|null',
                    tipo_leilao: 'string|null',
                    valor_avaliacao: 'number|null',
                    valor_minimo: 'number|null',
                    cidade: 'string|null',
                    estado: 'string|null',
                    data_leilao: 'string|null',
                    status: 'string|null',
                    rua: 'string|null',
                    numero: 'string|null',
                    complemento: 'string|null',
                    cep: 'string|null',
                    tipo_propriedade: 'string|null',
                    quartos: 'number|null',
                    banheiros: 'number|null',
                    area_total: 'number|null',
                    area_construida: 'number|null',
                    ano_construcao: 'number|null',
                  },
                  detalhes: {
                    resumo_executivo: 'string|null',
                    ocupacao: 'string|null',
                    matricula: 'string|null',
                    cartorio: 'string|null',
                    numero_processo: 'string|null',
                    valor_mercado: 'number|null',
                    lance_recomendado: 'number|null',
                    lucro_estimado: 'number|null',
                    roi_estimado: 'number|null',
                    divida_iptu: 'number|null',
                    divida_condominio: 'number|null',
                    analise: 'string|null',
                    riscos: 'string|null',
                    observacoes_juridicas: 'string|null',
                    estrategia: 'string|null',
                  },
                  campos_detectados: {
                    matricula: 'string|null',
                    cartorio: 'string|null',
                    numero_processo: 'string|null',
                    cep: 'string|null',
                    cidade: 'string|null',
                    estado: 'string|null',
                    area_total: 'number|null',
                    area_construida: 'number|null',
                    quartos: 'number|null',
                    banheiros: 'number|null',
                    valor_minimo: 'number|null',
                    valor_avaliacao: 'number|null',
                    valor_mercado: 'number|null',
                    divida_iptu: 'number|null',
                    divida_condominio: 'number|null',
                  },
                },
                null,
                2,
              ),
              '',
              'Em texto_base, coloque uma transcricao resumida e fiel do conteudo principal do PDF, suficiente para auditoria humana.',
            ].join('\n'),
          },
          {
            type: 'input_file',
            file_url: fileUrl,
          },
        ],
      },
    ],
  });

  const parsed = parseJsonObject(response.output_text);

  if (!parsed) {
    throw new Error('A OpenAI nao retornou um JSON valido para o PDF.');
  }

  return {
    ...parsed,
    estrategia_extracao:
      parsed.estrategia_extracao ?? 'openai_pdf_input_file',
  };
}

async function applyStructuredUpdates(
  propertyId: string,
  extraction: StructuredExtraction,
) {
  const supabase = createAdminClient();
  const [{ data: imovelAtual, error: imovelAtualError }, { data: detalhesAtuais, error: detalhesAtuaisError }] =
    await Promise.all([
      supabase.from('imoveis').select('*').eq('id', propertyId).maybeSingle(),
      supabase
        .from('imovel_detalhes')
        .select('*')
        .eq('imovel_id', propertyId)
        .maybeSingle(),
    ]);

  if (imovelAtualError) {
    throw new Error(`Falha ao carregar os dados atuais do imovel: ${imovelAtualError.message}`);
  }

  if (detalhesAtuaisError) {
    throw new Error(`Falha ao carregar o dossie atual do imovel: ${detalhesAtuaisError.message}`);
  }

  const imovelUpdate = mergeOnlyEmptyFields(
    (imovelAtual ?? {}) as Record<string, unknown>,
    compactObject(extraction.imovel ?? {}),
  );
  if (Object.keys(imovelUpdate).length > 0) {
    const { error } = await supabase
      .from('imoveis')
      .update(imovelUpdate)
      .eq('id', propertyId);

    if (error) {
      throw new Error(`Falha ao atualizar os dados do imovel: ${error.message}`);
    }
  }

  const detalhesUpdate = mergeOnlyEmptyFields(
    (detalhesAtuais ?? {}) as Record<string, unknown>,
    compactObject(extraction.detalhes ?? {}),
  );
  if (Object.keys(detalhesUpdate).length > 0) {
    const { error } = await supabase.from('imovel_detalhes').upsert(
      {
        imovel_id: propertyId,
        ...detalhesUpdate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'imovel_id' },
    );

    if (error) {
      throw new Error(`Falha ao atualizar o dossie do imovel: ${error.message}`);
    }
  }
}

async function upsertExtraction({
  arquivoId,
  propertyId,
  status,
  extractedText,
  summary,
  extractedFields,
  errorMessage,
}: {
  arquivoId: string;
  propertyId: string;
  status: ExtractionStatus;
  extractedText?: string;
  summary?: string;
  extractedFields?: Record<string, unknown>;
  errorMessage?: string | null;
}) {
  const supabase = createAdminClient();
  const payload: Database['public']['Tables']['imovel_arquivo_extracoes']['Insert'] =
    {
      arquivo_id: arquivoId,
      imovel_id: propertyId,
      status,
      texto_extraido: extractedText ?? null,
      resumo: summary ?? null,
      campos_extraidos: (extractedFields ?? {}) as Json,
      erro: errorMessage ?? null,
      updated_at: new Date().toISOString(),
    };

  const { error } = await supabase
    .from('imovel_arquivo_extracoes')
    .upsert(payload, { onConflict: 'arquivo_id' });

  if (error) {
    throw new Error(`Falha ao registrar a extracao do arquivo: ${error.message}`);
  }
}

function createOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function looksLikePdf(fileName: string, fileType?: string | null) {
  return (
    (fileType ?? '').toLowerCase().includes('pdf') ||
    fileName.toLowerCase().endsWith('.pdf')
  );
}

function parseJsonObject(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    return JSON.parse(normalized) as StructuredExtraction;
  } catch {
    return null;
  }
}

function getDocumentSpecificInstructions(documentType: string | null) {
  switch ((documentType ?? '').toLowerCase()) {
    case 'edital':
      return 'Se for edital, priorize regras do leilao, datas, valor minimo, valor de avaliacao, ocupacao, processo, debitos, riscos e estrategia.';
    case 'matricula':
      return 'Se for matricula, priorize matricula, cartorio, endereco, area total, area construida, proprietarios, averbacoes e observacoes juridicas.';
    case 'certidao':
      return 'Se for certidao, priorize onus, restricoes, acoes, penhoras, observacoes juridicas, riscos, processo e cartorio.';
    case 'analise':
      return 'Se for analise, priorize resumo executivo, valor de mercado, lance recomendado, lucro estimado, ROI, analise, riscos e estrategia.';
    default:
      return 'Identifique o documento pelo conteudo e extraia o maximo possivel dos campos do cadastro do imovel.';
  }
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) => entry !== undefined && entry !== null && entry !== '',
    ),
  ) as Partial<T>;
}

function mergeOnlyEmptyFields<TIncoming extends Record<string, unknown>>(
  existing: Record<string, unknown>,
  incoming: TIncoming,
) {
  return Object.fromEntries(
    Object.entries(incoming).filter(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return false;
      }

      return isEmptyValue(existing[key]);
    }),
  ) as Partial<TIncoming>;
}

function isEmptyValue(value: unknown) {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim() === '';
  }

  return false;
}
