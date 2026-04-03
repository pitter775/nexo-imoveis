import 'server-only';

import OpenAI from 'openai';
import type { Responses } from 'openai/resources/responses/responses';
import { logAdminEvents } from '@/lib/admin/logger';
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
    valor_primeiro_leilao: number | null;
    valor_segundo_leilao: number | null;
    cidade: string | null;
    estado: string | null;
    data_leilao: string | null;
    data_primeiro_leilao: string | null;
    data_segundo_leilao: string | null;
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

type DadosLeilao = {
  valor_avaliacao: number | null;
  valor_primeiro_leilao: number | null;
  valor_segundo_leilao: number | null;
  data_primeiro_leilao: string | null;
  data_segundo_leilao: string | null;
};

type FieldVisualStatus = 'filled' | 'updated' | 'missing';

type ExtractionFieldStatuses = {
  imovel: Record<string, FieldVisualStatus>;
  detalhes: Record<string, FieldVisualStatus>;
};

type ProcessingLogEntry = {
  at: string;
  level: 'info' | 'warn' | 'error';
  stage: string;
  message: string;
};

export async function processPropertyDocument(
  input: ProcessPropertyDocumentInput,
) {
  const processingLog: ProcessingLogEntry[] = [];
  let persistedLogCount = 0;
  const appendLog = (
    stage: string,
    message: string,
    level: ProcessingLogEntry['level'] = 'info',
  ) => {
    processingLog.push({
      at: new Date().toISOString(),
      level,
      stage,
      message,
    });
  };
  const syncAdminLogs = async () => {
    const nextEntries = processingLog.slice(persistedLogCount);

    if (nextEntries.length === 0) {
      return;
    }

    await logAdminEvents(
      nextEntries.map((entry) => ({
        origem: 'processamento_arquivo',
        nivel: entry.level,
        etapa: entry.stage,
        contexto: input.documentType ?? 'arquivo',
        imovel_id: input.propertyId,
        arquivo_id: input.arquivoId,
        mensagem: entry.message,
        detalhes: {
          at: entry.at,
          file_name: input.fileName,
        },
      })),
    );

    persistedLogCount = processingLog.length;
  };

  appendLog('upload', `Inicio do processamento do arquivo ${input.fileName}.`);
  await syncAdminLogs();

  await upsertExtraction({
    arquivoId: input.arquivoId,
    propertyId: input.propertyId,
    status: 'processando',
    errorMessage: null,
    extractedFields: {
      processing_log: processingLog,
    },
  });

  try {
    if (!looksLikePdf(input.fileName, input.fileType)) {
      appendLog('validacao', 'Arquivo ignorado porque nao foi identificado como PDF.', 'warn');
      await syncAdminLogs();
      await upsertExtraction({
        arquivoId: input.arquivoId,
        propertyId: input.propertyId,
        status: 'ignorado',
        summary: 'Arquivo salvo sem processamento automatico porque nao e um PDF.',
        extractedFields: {
          motivo: 'arquivo_nao_pdf',
          nome_arquivo: input.fileName,
          tipo_documento: input.documentType ?? null,
          processing_log: processingLog,
        },
      });

      return { status: 'ignorado' as const };
    }

    if (!process.env.OPENAI_API_KEY) {
      appendLog('configuracao', 'OPENAI_API_KEY nao configurada para processar o PDF.', 'error');
      await syncAdminLogs();
      throw new Error('OPENAI_API_KEY nao configurada para leitura inteligente de PDF.');
    }

    appendLog('extracao', 'Iniciando extracao estruturada principal do documento.');
    await syncAdminLogs();
    const structured = await extractStructuredDataFromPdf({
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      documentType: input.documentType ?? null,
    });
    appendLog(
      'extracao',
      `Extracao estruturada principal concluida. Texto base disponivel: ${structured.texto_base ? 'sim' : 'nao'}.`,
    );
    await syncAdminLogs();

    appendLog('normalizacao', 'Iniciando extracao e normalizacao dos dados de leilao.');
    await syncAdminLogs();
    const dadosLeilao = await extractAndNormalizeAuctionData({
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      documentType: input.documentType ?? null,
      structured,
      log: appendLog,
    });
    await syncAdminLogs();
    appendLog(
      'normalizacao',
      `Dados de leilao normalizados. Revisao pendente: ${dadosLeilao.pendingReview ? 'sim' : 'nao'}.`,
      dadosLeilao.pendingReview ? 'warn' : 'info',
    );
    await syncAdminLogs();

    appendLog('persistencia', 'Iniciando absorcao dos dados extraidos no cadastro do imovel.');
    await syncAdminLogs();
    const appliedChanges = await applyStructuredUpdates(
      input.propertyId,
      structured,
      dadosLeilao.data,
    );
    appendLog(
      'persistencia',
      `Absorcao concluida. Imovel: ${Object.keys(appliedChanges.fieldStatuses.imovel).length} campos sinalizados. Dossie: ${Object.keys(appliedChanges.fieldStatuses.detalhes).length} campos sinalizados.`,
    );
    await syncAdminLogs();

    const fieldsPayload = {
      tipo_documento: input.documentType ?? null,
      nome_arquivo: input.fileName,
      estrategia_extracao:
        structured.estrategia_extracao ?? 'openai_pdf_input_file',
      dados_leilao: dadosLeilao.data,
      pendente_revisao: dadosLeilao.pendingReview,
      motivos_revisao: dadosLeilao.reviewReasons,
      field_statuses: appliedChanges.fieldStatuses,
      preview_preenchimento: appliedChanges.previewValues,
      processing_log: processingLog,
      ...(structured.campos_detectados ?? {}),
      ...(structured.imovel ? { imovel: structured.imovel } : {}),
      ...(structured.detalhes ? { detalhes: structured.detalhes } : {}),
    };

    appendLog('finalizacao', 'Processamento do arquivo concluido com sucesso.');
    await syncAdminLogs();

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

    appendLog('erro', message, 'error');
    await syncAdminLogs();

    await upsertExtraction({
      arquivoId: input.arquivoId,
      propertyId: input.propertyId,
      status: 'erro',
      errorMessage: message,
      extractedFields: {
        processing_log: processingLog,
      },
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
    text: {
      format: buildStructuredExtractionFormat(),
    },
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
                    valor_primeiro_leilao: 'number|null',
                    valor_segundo_leilao: 'number|null',
                    cidade: 'string|null',
                    estado: 'string|null',
                    data_leilao: 'string|null',
                    data_primeiro_leilao: 'YYYY-MM-DD|null',
                    data_segundo_leilao: 'YYYY-MM-DD|null',
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
    throw new Error(
      `A OpenAI nao retornou um JSON valido para o PDF. Resposta bruta: ${truncateText(response.output_text)}`,
    );
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
  dadosLeilao: DadosLeilao,
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

  const imovelPlan = buildAuthoritativeFieldPlan(
    (imovelAtual ?? {}) as Record<string, unknown>,
    {
      ...(extraction.imovel ?? {}),
      valor_avaliacao: dadosLeilao.valor_avaliacao,
      valor_minimo: dadosLeilao.valor_primeiro_leilao,
      valor_primeiro_leilao: dadosLeilao.valor_primeiro_leilao,
      valor_segundo_leilao: dadosLeilao.valor_segundo_leilao,
      data_leilao: dadosLeilao.data_primeiro_leilao,
      data_primeiro_leilao: dadosLeilao.data_primeiro_leilao,
      data_segundo_leilao: dadosLeilao.data_segundo_leilao,
    },
    [
      'valor_avaliacao',
      'valor_primeiro_leilao',
      'valor_segundo_leilao',
      'data_primeiro_leilao',
      'data_segundo_leilao',
    ],
  );
  if (Object.keys(imovelPlan.update).length > 0) {
    const { error } = await supabase
      .from('imoveis')
      .update(imovelPlan.update)
      .eq('id', propertyId);

    if (error) {
      throw new Error(`Falha ao atualizar os dados do imovel: ${error.message}`);
    }
  }

  const detalhesPlan = buildAuthoritativeFieldPlan(
    (detalhesAtuais ?? {}) as Record<string, unknown>,
    extraction.detalhes ?? {},
  );
  if (Object.keys(detalhesPlan.update).length > 0) {
    const { error } = await supabase.from('imovel_detalhes').upsert(
      {
        imovel_id: propertyId,
        ...detalhesPlan.update,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'imovel_id' },
    );

    if (error) {
      throw new Error(`Falha ao atualizar o dossie do imovel: ${error.message}`);
    }
  }

  return {
    fieldStatuses: {
      imovel: imovelPlan.statuses,
      detalhes: detalhesPlan.statuses,
    } satisfies ExtractionFieldStatuses,
    previewValues: {
      imovel: imovelPlan.preview,
      detalhes: detalhesPlan.preview,
    },
  };
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
    return tryParseJsonSubstring(normalized);
  }
}

function tryParseJsonSubstring(value: string) {
  const firstBrace = value.indexOf('{');
  const lastBrace = value.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const candidate = value.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(candidate) as StructuredExtraction;
  } catch {
    return null;
  }
}

function getDocumentSpecificInstructions(documentType: string | null) {
  switch ((documentType ?? '').toLowerCase()) {
    case 'edital':
      return 'Se for edital, priorize regras do leilao, valor de avaliacao, valor do primeiro leilao, valor do segundo leilao, data do primeiro leilao, data do segundo leilao, ocupacao, processo, debitos, riscos e estrategia.';
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

function isEmptyValue(value: unknown) {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim() === '';
  }

  return false;
}

function buildAuthoritativeFieldPlan<TIncoming extends Record<string, unknown>>(
  existing: Record<string, unknown>,
  incoming: TIncoming,
  requiredKeys: string[] = [],
) {
  const update: Record<string, unknown> = {};
  const preview: Record<string, unknown> = {};
  const statuses: Record<string, FieldVisualStatus> = {};
  const keys = new Set([...Object.keys(incoming), ...requiredKeys]);

  for (const key of keys) {
    const nextValue = incoming[key];
    const currentValue = existing[key];

    if (nextValue === undefined || nextValue === null || nextValue === '') {
      if (requiredKeys.includes(key)) {
        statuses[key] = 'missing';
      }
      continue;
    }

    preview[key] = nextValue;

    if (isEmptyValue(currentValue)) {
      update[key] = nextValue;
      statuses[key] = 'filled';
      continue;
    }

    if (!areEquivalentFieldValues(currentValue, nextValue)) {
      update[key] = nextValue;
      statuses[key] = 'updated';
    }
  }

  return {
    update,
    preview,
    statuses,
  };
}

function areEquivalentFieldValues(currentValue: unknown, nextValue: unknown) {
  if (typeof currentValue === 'number' && typeof nextValue === 'number') {
    return currentValue === nextValue;
  }

  if (typeof currentValue === 'string' && typeof nextValue === 'string') {
    return currentValue.trim() === nextValue.trim();
  }

  return currentValue === nextValue;
}

async function extractAndNormalizeAuctionData({
  fileUrl,
  fileName,
  documentType,
  structured,
  log,
}: {
  fileUrl: string;
  fileName: string;
  documentType: string | null;
  structured: StructuredExtraction;
  log?: (stage: string, message: string, level?: ProcessingLogEntry['level']) => void;
}) {
  log?.('normalizacao', 'Montando candidatos a partir da extracao estruturada.');
  const fromStructured = normalizeAuctionData({
    valor_avaliacao: structured.imovel?.valor_avaliacao ?? null,
    valor_primeiro_leilao:
      structured.imovel?.valor_primeiro_leilao ??
      structured.imovel?.valor_minimo ??
      null,
    valor_segundo_leilao: structured.imovel?.valor_segundo_leilao ?? null,
    data_primeiro_leilao:
      structured.imovel?.data_primeiro_leilao ??
      structured.imovel?.data_leilao ??
      null,
    data_segundo_leilao: structured.imovel?.data_segundo_leilao ?? null,
  });

  let fromStrictJson = createEmptyAuctionData();

  try {
    log?.('normalizacao', 'Solicitando extracao strict JSON dos dados de leilao.');
    fromStrictJson = await extractAuctionDataFromPdfStrict({
      fileUrl,
      fileName,
      documentType,
    });
    log?.('normalizacao', 'Extracao strict JSON concluida com sucesso.');
  } catch {
    log?.('normalizacao', 'Extracao strict JSON falhou. Seguindo com fallback.', 'warn');
    fromStrictJson = createEmptyAuctionData();
  }

  log?.('normalizacao', 'Aplicando fallback por regex sobre o texto extraido.');
  const fromRegex = normalizeAuctionDataFromText(
    [structured.texto_base, structured.resumo_documento]
      .filter(Boolean)
      .join('\n'),
  );

  const data = mergeAuctionData(
    fromStrictJson,
    fromRegex,
    fromStructured,
  );
  const validation = validateAuctionData(data);

  if (validation.pendingReview) {
    log?.(
      'validacao',
      `Dados marcados para revisao: ${validation.reasons.join(', ')}.`,
      'warn',
    );
  } else {
    log?.('validacao', 'Dados de leilao passaram pelas validacoes configuradas.');
  }

  return {
    data,
    pendingReview: validation.pendingReview,
    reviewReasons: validation.reasons,
  };
}

async function extractAuctionDataFromPdfStrict({
  fileUrl,
  fileName,
  documentType,
}: {
  fileUrl: string;
  fileName: string;
  documentType: string | null;
}): Promise<DadosLeilao> {
  const client = createOpenAIClient();
  const response = await client.responses.create({
    model: EXTRACTION_MODEL,
    text: {
      format: buildAuctionDataFormat(),
    },
    input: [
      {
        role: 'system',
        content: [
          'Voce extrai exclusivamente dados de leilao de um edital PDF.',
          'Nao invente valores.',
          'Cada campo deve ser tratado de forma independente.',
          'Nao descarte o resultado se algum campo estiver ausente.',
          'Nao confie na ordem do texto. Use contexto explicito como avaliacao, 1 leilao, 1a praca, 2 leilao e 2a praca.',
          'Retorne somente JSON valido, sem markdown e sem texto extra.',
          'Datas devem sair no formato YYYY-MM-DD quando houver confianca suficiente.',
          'Valores monetarios devem sair como numero decimal sem simbolos.',
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
              'Retorne exatamente este JSON:',
              JSON.stringify(
                {
                  valor_avaliacao: 'number|null',
                  valor_primeiro_leilao: 'number|null',
                  valor_segundo_leilao: 'number|null',
                  data_primeiro_leilao: 'YYYY-MM-DD|null',
                  data_segundo_leilao: 'YYYY-MM-DD|null',
                },
                null,
                2,
              ),
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
    throw new Error(
      `A OpenAI nao retornou JSON valido para os dados de leilao. Resposta bruta: ${truncateText(response.output_text)}`,
    );
  }

  return normalizeAuctionData(parsed as Partial<DadosLeilao>);
}

function createEmptyAuctionData(): DadosLeilao {
  return {
    valor_avaliacao: null,
    valor_primeiro_leilao: null,
    valor_segundo_leilao: null,
    data_primeiro_leilao: null,
    data_segundo_leilao: null,
  };
}

function normalizeAuctionData(value: Partial<DadosLeilao> | null | undefined): DadosLeilao {
  return {
    valor_avaliacao: normalizeMoneyValue(value?.valor_avaliacao ?? null),
    valor_primeiro_leilao: normalizeMoneyValue(value?.valor_primeiro_leilao ?? null),
    valor_segundo_leilao: normalizeMoneyValue(value?.valor_segundo_leilao ?? null),
    data_primeiro_leilao: normalizeDateValue(value?.data_primeiro_leilao ?? null),
    data_segundo_leilao: normalizeDateValue(value?.data_segundo_leilao ?? null),
  };
}

function mergeAuctionData(...sources: Partial<DadosLeilao>[]): DadosLeilao {
  return {
    valor_avaliacao: pickFirstDefinedNumber(sources.map((source) => source.valor_avaliacao)),
    valor_primeiro_leilao: pickFirstDefinedNumber(
      sources.map((source) => source.valor_primeiro_leilao),
    ),
    valor_segundo_leilao: pickFirstDefinedNumber(
      sources.map((source) => source.valor_segundo_leilao),
    ),
    data_primeiro_leilao: pickFirstDefinedString(
      sources.map((source) => source.data_primeiro_leilao),
    ),
    data_segundo_leilao: pickFirstDefinedString(
      sources.map((source) => source.data_segundo_leilao),
    ),
  };
}

function normalizeAuctionDataFromText(text: string) {
  if (!text.trim()) {
    return createEmptyAuctionData();
  }

  const normalizedText = normalizeSearchText(text);

  return normalizeAuctionData({
    valor_avaliacao: extractMoneyByContext(normalizedText, [
      'avaliacao',
      'valor de avaliacao',
      'avaliado em',
    ]),
    valor_primeiro_leilao: extractMoneyByContext(normalizedText, [
      '1 leilao',
      '1o leilao',
      '1 leilao',
      '1a praca',
      'primeiro leilao',
      'primeira praca',
    ]),
    valor_segundo_leilao: extractMoneyByContext(normalizedText, [
      '2 leilao',
      '2o leilao',
      '2 leilao',
      '2a praca',
      'segundo leilao',
      'segunda praca',
    ]),
    data_primeiro_leilao: extractDateByContext(normalizedText, [
      '1 leilao',
      '1o leilao',
      '1a praca',
      'primeiro leilao',
      'primeira praca',
    ]),
    data_segundo_leilao: extractDateByContext(normalizedText, [
      '2 leilao',
      '2o leilao',
      '2a praca',
      'segundo leilao',
      'segunda praca',
    ]),
  });
}

function validateAuctionData(data: DadosLeilao) {
  const reasons: string[] = [];

  // Mantem o salvamento parcial, mas sinaliza incoerencias para revisao.
  if (
    data.valor_avaliacao != null &&
    data.valor_primeiro_leilao != null &&
    data.valor_avaliacao < data.valor_primeiro_leilao
  ) {
    reasons.push('valor_avaliacao_menor_que_valor_primeiro_leilao');
  }

  if (
    data.valor_primeiro_leilao != null &&
    data.valor_segundo_leilao != null &&
    data.valor_primeiro_leilao < data.valor_segundo_leilao
  ) {
    reasons.push('valor_primeiro_leilao_menor_que_valor_segundo_leilao');
  }

  if (data.data_primeiro_leilao && data.data_segundo_leilao) {
    const first = Date.parse(data.data_primeiro_leilao);
    const second = Date.parse(data.data_segundo_leilao);

    if (Number.isFinite(first) && Number.isFinite(second) && first >= second) {
      reasons.push('ordem_datas_invalida');
    }
  }

  return {
    pendingReview: reasons.length > 0,
    reasons,
  };
}

function normalizeMoneyValue(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed
    .replace(/[Rr]\$/g, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDateValue(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  if (!match) {
    return null;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function pickFirstDefinedNumber(values: Array<number | null | undefined>) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function pickFirstDefinedString(values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return null;
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00ba/g, 'o')
    .replace(/\u00aa/g, 'a')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function extractMoneyByContext(text: string, contexts: string[]) {
  for (const context of contexts) {
    const escapedContext = escapeRegExp(context);
    const regex = new RegExp(
      `${escapedContext}[\\s\\S]{0,80}?(r\\$\\s?[\\d.]+,\\d{2}|[\\d.]+,\\d{2})`,
      'i',
    );
    const match = text.match(regex);

    if (match?.[1]) {
      return normalizeMoneyValue(match[1]);
    }
  }

  return null;
}

function extractDateByContext(text: string, contexts: string[]) {
  for (const context of contexts) {
    const escapedContext = escapeRegExp(context);
    const regex = new RegExp(
      `${escapedContext}[\\s\\S]{0,80}?(\\d{2}/\\d{2}/\\d{4})`,
      'i',
    );
    const match = text.match(regex);

    if (match?.[1]) {
      return normalizeDateValue(match[1]);
    }
  }

  return null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function truncateText(value: string | null | undefined, maxLength = 1200) {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

function buildStructuredExtractionFormat(): Responses.ResponseFormatTextJSONSchemaConfig {
  return {
    type: 'json_schema',
    strict: true,
    name: 'property_document_extraction',
    description: 'Extracao estruturada de dados de imoveis e dossie a partir de PDF.',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        texto_base: { type: ['string', 'null'] },
        resumo_documento: { type: ['string', 'null'] },
        estrategia_extracao: { type: ['string', 'null'] },
        imovel: {
          type: ['object', 'null'],
          additionalProperties: false,
          properties: {
            descricao: { type: ['string', 'null'] },
            tipo_leilao: { type: ['string', 'null'] },
            valor_avaliacao: { type: ['number', 'null'] },
            valor_minimo: { type: ['number', 'null'] },
            valor_primeiro_leilao: { type: ['number', 'null'] },
            valor_segundo_leilao: { type: ['number', 'null'] },
            cidade: { type: ['string', 'null'] },
            estado: { type: ['string', 'null'] },
            data_leilao: { type: ['string', 'null'] },
            data_primeiro_leilao: { type: ['string', 'null'] },
            data_segundo_leilao: { type: ['string', 'null'] },
            status: { type: ['string', 'null'] },
            rua: { type: ['string', 'null'] },
            numero: { type: ['string', 'null'] },
            complemento: { type: ['string', 'null'] },
            cep: { type: ['string', 'null'] },
            tipo_propriedade: { type: ['string', 'null'] },
            quartos: { type: ['number', 'null'] },
            banheiros: { type: ['number', 'null'] },
            area_total: { type: ['number', 'null'] },
            area_construida: { type: ['number', 'null'] },
            ano_construcao: { type: ['number', 'null'] },
          },
          required: [
            'descricao',
            'tipo_leilao',
            'valor_avaliacao',
            'valor_minimo',
            'valor_primeiro_leilao',
            'valor_segundo_leilao',
            'cidade',
            'estado',
            'data_leilao',
            'data_primeiro_leilao',
            'data_segundo_leilao',
            'status',
            'rua',
            'numero',
            'complemento',
            'cep',
            'tipo_propriedade',
            'quartos',
            'banheiros',
            'area_total',
            'area_construida',
            'ano_construcao',
          ],
        },
        detalhes: {
          type: ['object', 'null'],
          additionalProperties: false,
          properties: {
            resumo_executivo: { type: ['string', 'null'] },
            ocupacao: { type: ['string', 'null'] },
            matricula: { type: ['string', 'null'] },
            cartorio: { type: ['string', 'null'] },
            numero_processo: { type: ['string', 'null'] },
            valor_mercado: { type: ['number', 'null'] },
            lance_recomendado: { type: ['number', 'null'] },
            lucro_estimado: { type: ['number', 'null'] },
            roi_estimado: { type: ['number', 'null'] },
            divida_iptu: { type: ['number', 'null'] },
            divida_condominio: { type: ['number', 'null'] },
            analise: { type: ['string', 'null'] },
            riscos: { type: ['string', 'null'] },
            observacoes_juridicas: { type: ['string', 'null'] },
            estrategia: { type: ['string', 'null'] },
          },
          required: [
            'resumo_executivo',
            'ocupacao',
            'matricula',
            'cartorio',
            'numero_processo',
            'valor_mercado',
            'lance_recomendado',
            'lucro_estimado',
            'roi_estimado',
            'divida_iptu',
            'divida_condominio',
            'analise',
            'riscos',
            'observacoes_juridicas',
            'estrategia',
          ],
        },
        campos_detectados: {
          type: ['object', 'null'],
          additionalProperties: {
            type: ['string', 'number', 'boolean', 'null'],
          },
        },
      },
      required: [
        'texto_base',
        'resumo_documento',
        'estrategia_extracao',
        'imovel',
        'detalhes',
        'campos_detectados',
      ],
    },
  };
}

function buildAuctionDataFormat(): Responses.ResponseFormatTextJSONSchemaConfig {
  return {
    type: 'json_schema',
    strict: true,
    name: 'auction_data_extraction',
    description: 'Extracao estrita dos dados principais de leilao a partir de edital PDF.',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        valor_avaliacao: { type: ['number', 'null'] },
        valor_primeiro_leilao: { type: ['number', 'null'] },
        valor_segundo_leilao: { type: ['number', 'null'] },
        data_primeiro_leilao: { type: ['string', 'null'] },
        data_segundo_leilao: { type: ['string', 'null'] },
      },
      required: [
        'valor_avaliacao',
        'valor_primeiro_leilao',
        'valor_segundo_leilao',
        'data_primeiro_leilao',
        'data_segundo_leilao',
      ],
    },
  };
}
