import 'server-only';

import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/admin';

type ConversationRole = 'user' | 'assistant';

type PropertyChatRequest = {
  propertyId: string;
  question: string;
  conversationId?: string | null;
  userId?: string | null;
};

type PropertyChatResponse = {
  conversationId: string;
  reply: string;
};

type StoredConversationMessage = {
  role: ConversationRole;
  content: string;
  created_at: string;
};

type ConversationSummaryState = {
  resumo: string | null;
  metadata: Record<string, unknown>;
};

type PropertyContextRecord = {
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
};

type PropertyDossierRecord = {
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
};

type PropertyFileRecord = {
  id: string;
  nome_arquivo: string | null;
  url_storage: string | null;
  tipo_documento: string | null;
  visivel_publico: boolean | null;
  visivel_pagantes: boolean | null;
};

type ConversationMessageRecord = {
  role: string;
  conteudo: string;
};

const DEFAULT_MODEL = process.env.OPENAI_CHAT_MODEL ?? 'gpt-4.1-mini';
const RECENT_MESSAGES_FOR_PROMPT = 6;
const MIN_MESSAGES_TO_SUMMARIZE = 10;
const SUMMARY_REFRESH_INTERVAL = 6;

export async function answerPropertyQuestion({
  propertyId,
  question,
  conversationId,
  userId,
}: PropertyChatRequest): Promise<PropertyChatResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const supabase = createAdminClient();
  const property = await loadPropertyContext(propertyId);

  if (!property) {
    throw new Error('Property not found.');
  }

  const activeConversationId =
    conversationId ??
    (await createConversation({
      userId: userId ?? null,
      propertyId,
      title: property.imovel.titulo,
    }));

  await appendMessage({
    conversationId: activeConversationId,
    role: 'user',
    content: question,
    source: 'web_public',
  });

  const conversationState = await getConversationSummaryState(activeConversationId);
  const recentMessages = await listRecentMessages(
    activeConversationId,
    RECENT_MESSAGES_FOR_PROMPT,
  );
  const selectedContext = selectRelevantContext(question, property);

  const response = await getOpenAIClient().responses.create({
    model: DEFAULT_MODEL,
    input: [
      {
        role: 'system',
        content: buildSystemPrompt(property.imovel.titulo),
      },
      {
        role: 'user',
        content: [
          'Contexto do imovel:',
          JSON.stringify(selectedContext, null, 2),
          '',
          buildPromptHistorySection({
            resumo: conversationState.resumo,
            recentMessages,
          }),
          '',
          `Pergunta atual do cliente: ${question}`,
        ].join('\n'),
      },
    ],
  });

  const reply =
    sanitizeAssistantReply(response.output_text) ||
    'Nao consegui gerar uma resposta neste momento. Tente novamente em instantes.';

  const usage = response.usage as
    | {
        input_tokens?: number;
        output_tokens?: number;
      }
    | undefined;

  await appendMessage({
    conversationId: activeConversationId,
    role: 'assistant',
    content: reply,
    model: DEFAULT_MODEL,
    inputTokens: usage?.input_tokens ?? null,
    outputTokens: usage?.output_tokens ?? null,
    source: 'openai',
  });

  await supabase
    .from('chat_conversas')
    .update({
      user_id: userId ?? null,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', activeConversationId);

  await maybeRefreshConversationSummary({
    conversationId: activeConversationId,
    propertyTitle: property.imovel.titulo,
    currentSummary: conversationState.resumo,
    currentMetadata: conversationState.metadata,
  });

  return {
    conversationId: activeConversationId,
    reply,
  };
}

export async function getLatestPropertyConversation({
  propertyId,
  userId,
}: {
  propertyId: string;
  userId: string;
}) {
  const supabase = createAdminClient();
  const { data: conversation, error: conversationError } = await supabase
    .from('chat_conversas')
    .select('id')
    .eq('imovel_id', propertyId)
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (conversationError) {
    throw new Error(`Failed to load conversation: ${conversationError.message}`);
  }

  if (!conversation) {
    return null;
  }

  const messages = await listConversationMessages(conversation.id as string);

  return {
    conversationId: conversation.id as string,
    messages,
  };
}

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function loadPropertyContext(propertyId: string) {
  const supabase = createAdminClient();
  const [{ data: imovel, error: imovelError }, { data: detalhes, error: detalhesError }, { data: arquivos, error: arquivosError }] =
    await Promise.all([
      supabase
        .from('imoveis')
        .select(
          'id, titulo, descricao, tipo_leilao, tipo_propriedade, valor_avaliacao, valor_minimo, quartos, banheiros, area_total, area_construida, ano_construcao, rua, numero, complemento, cidade, estado, cep, data_leilao, status',
        )
        .eq('id', propertyId)
        .maybeSingle(),
      supabase
        .from('imovel_detalhes')
        .select(
          'imovel_id, resumo_executivo, ocupacao, matricula, cartorio, numero_processo, valor_mercado, lance_recomendado, lucro_estimado, roi_estimado, divida_iptu, divida_condominio, analise, riscos, observacoes_juridicas, estrategia',
        )
        .eq('imovel_id', propertyId)
        .maybeSingle(),
      supabase
        .from('imovel_arquivos')
        .select(
          'id, nome_arquivo, url_storage, tipo_documento, visivel_publico, visivel_pagantes',
        )
        .eq('imovel_id', propertyId)
        .order('created_at', { ascending: false }),
    ]);

  if (imovelError) {
    throw new Error(`Failed to load property: ${imovelError.message}`);
  }

  if (detalhesError) {
    throw new Error(`Failed to load property dossier: ${detalhesError.message}`);
  }

  if (arquivosError) {
    throw new Error(`Failed to load property files: ${arquivosError.message}`);
  }

  if (!imovel) {
    return null;
  }

  return {
    imovel: imovel as PropertyContextRecord,
    detalhes: (detalhes as PropertyDossierRecord | null) ?? null,
    arquivos: (arquivos as PropertyFileRecord[] | null) ?? [],
  };
}

function buildPromptHistorySection({
  resumo,
  recentMessages,
}: {
  resumo: string | null;
  recentMessages: ConversationMessageRecord[];
}) {
  if (resumo?.trim()) {
    return [
      'Resumo acumulado da conversa:',
      resumo.trim(),
      '',
      'Trecho mais recente da conversa:',
      formatConversationHistory(recentMessages),
    ].join('\n');
  }

  return ['Historico recente da conversa:', formatConversationHistory(recentMessages)].join(
    '\n',
  );
}

function selectRelevantContext(
  question: string,
  property: NonNullable<Awaited<ReturnType<typeof loadPropertyContext>>>,
) {
  const normalizedQuestion = normalize(question);

  const baseContext = {
    basico: {
      titulo: property.imovel.titulo,
      descricao: property.imovel.descricao,
      tipo_propriedade: property.imovel.tipo_propriedade,
      tipo_leilao: property.imovel.tipo_leilao,
      status: property.imovel.status,
      endereco: [property.imovel.rua, property.imovel.numero, property.imovel.complemento]
        .filter(Boolean)
        .join(', '),
      cidade: property.imovel.cidade,
      estado: property.imovel.estado,
      cep: property.imovel.cep,
      data_leilao: property.imovel.data_leilao,
    },
  };

  const includesAny = (terms: string[]) =>
    terms.some((term) => normalizedQuestion.includes(term));

  const includeFinance = includesAny([
    'valor',
    'preco',
    'lance',
    'mercado',
    'roi',
    'lucro',
    'invest',
    'rentab',
    'retorno',
    'iptu',
    'condominio',
  ]);

  const includePhysical = includesAny([
    'quarto',
    'banheiro',
    'area',
    'metr',
    'constru',
    'tamanho',
    'imovel',
    'casa',
    'apartamento',
    'terreno',
  ]);

  const includeLegal = includesAny([
    'matricula',
    'cartorio',
    'processo',
    'jurid',
    'risco',
    'ocup',
    'edital',
    'divida',
  ]);

  const includeStrategy = includesAny([
    'vale a pena',
    'estrateg',
    'analise',
    'oportunidade',
    'recomend',
    'investir',
  ]);

  const includeFiles = includesAny([
    'arquivo',
    'documento',
    'certidao',
    'matricula',
    'edital',
  ]);

  return {
    ...baseContext,
    ...(includeFinance
      ? {
          financeiro: {
            valor_minimo: property.imovel.valor_minimo,
            valor_avaliacao: property.imovel.valor_avaliacao,
            valor_mercado: property.detalhes?.valor_mercado ?? null,
            lance_recomendado: property.detalhes?.lance_recomendado ?? null,
            lucro_estimado: property.detalhes?.lucro_estimado ?? null,
            roi_estimado: property.detalhes?.roi_estimado ?? null,
            divida_iptu: property.detalhes?.divida_iptu ?? null,
            divida_condominio: property.detalhes?.divida_condominio ?? null,
          },
        }
      : {}),
    ...(includePhysical
      ? {
          caracteristicas: {
            quartos: property.imovel.quartos,
            banheiros: property.imovel.banheiros,
            area_total: property.imovel.area_total,
            area_construida: property.imovel.area_construida,
            ano_construcao: property.imovel.ano_construcao,
          },
        }
      : {}),
    ...(includeLegal
      ? {
          juridico: {
            ocupacao: property.detalhes?.ocupacao ?? null,
            matricula: property.detalhes?.matricula ?? null,
            cartorio: property.detalhes?.cartorio ?? null,
            numero_processo: property.detalhes?.numero_processo ?? null,
            riscos: property.detalhes?.riscos ?? null,
            observacoes_juridicas: property.detalhes?.observacoes_juridicas ?? null,
          },
        }
      : {}),
    ...(includeStrategy
      ? {
          estrategia: {
            resumo_executivo: property.detalhes?.resumo_executivo ?? null,
            analise: property.detalhes?.analise ?? null,
            estrategia: property.detalhes?.estrategia ?? null,
          },
        }
      : {}),
    ...(includeFiles
      ? {
          arquivos: property.arquivos.map((arquivo) => ({
            nome_arquivo: arquivo.nome_arquivo,
            tipo_documento: arquivo.tipo_documento,
            visivel_publico: arquivo.visivel_publico,
            visivel_pagantes: arquivo.visivel_pagantes,
            url_storage: arquivo.url_storage,
          })),
        }
      : {}),
  };
}

function buildSystemPrompt(propertyTitle: string) {
  return [
    'Voce e um consultor virtual da Nexo Leiloes.',
    `Responda somente com base nos dados fornecidos sobre o imovel "${propertyTitle}".`,
    'Se alguma informacao nao estiver no contexto, diga claramente que ela nao consta nos dados cadastrados.',
    'Nao invente informacoes, nao generalize e nao fale sobre outros imoveis.',
    'Responda em portugues do Brasil, de forma objetiva, clara e comercial.',
    'Prefira respostas curtas, com no maximo 6 frases, exceto quando o usuario pedir mais detalhes.',
    'Nao encerre com frases solicitas como "Posso ajudar com mais alguma informacao?".',
  ].join(' ');
}

function formatConversationHistory(messages: ConversationMessageRecord[]) {
  if (messages.length === 0) {
    return 'Sem historico anterior.';
  }

  return messages
    .map((message) => `${message.role === 'assistant' ? 'Assistente' : 'Cliente'}: ${message.conteudo}`)
    .join('\n');
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

async function createConversation({
  userId,
  propertyId,
  title,
}: {
  userId: string | null;
  propertyId: string;
  title: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('chat_conversas')
    .insert({
      user_id: userId,
      imovel_id: propertyId,
      tipo_chat: 'imovel_cliente',
      titulo: `Chat do imovel: ${title}`,
      resumo: null,
      status: 'ativa',
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return data.id as string;
}

async function getConversationSummaryState(
  conversationId: string,
): Promise<ConversationSummaryState> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('chat_conversas')
    .select('resumo, metadata')
    .eq('id', conversationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load conversation summary state: ${error.message}`);
  }

  return {
    resumo: (data?.resumo as string | null | undefined) ?? null,
    metadata: isRecord(data?.metadata) ? data.metadata : {},
  };
}

async function appendMessage({
  conversationId,
  role,
  content,
  model,
  inputTokens,
  outputTokens,
  source,
}: {
  conversationId: string;
  role: ConversationRole;
  content: string;
  model?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  source: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('chat_mensagens').insert({
    conversa_id: conversationId,
    role,
    conteudo: content,
    modelo: model ?? null,
    tokens_input: inputTokens ?? null,
    tokens_output: outputTokens ?? null,
    origem: source,
  });

  if (error) {
    throw new Error(`Failed to save chat message: ${error.message}`);
  }
}

async function listRecentMessages(conversationId: string, limit: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('chat_mensagens')
    .select('role, conteudo')
    .eq('conversa_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load conversation history: ${error.message}`);
  }

  return ((data ?? []) as ConversationMessageRecord[]).reverse();
}

async function listConversationMessages(conversationId: string): Promise<StoredConversationMessage[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('chat_mensagens')
    .select('role, conteudo, created_at')
    .eq('conversa_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load full conversation history: ${error.message}`);
  }

  return ((data ?? []) as Array<{ role: string; conteudo: string; created_at: string }>).map(
    (message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.conteudo,
      created_at: message.created_at,
    }),
  );
}

async function maybeRefreshConversationSummary({
  conversationId,
  propertyTitle,
  currentSummary,
  currentMetadata,
}: {
  conversationId: string;
  propertyTitle: string;
  currentSummary: string | null;
  currentMetadata: Record<string, unknown>;
}) {
  const allMessages = await listConversationMessages(conversationId);
  const totalMessages = allMessages.length;
  const summarizedMessageCount = getSummarizedMessageCount(currentMetadata);

  if (totalMessages < MIN_MESSAGES_TO_SUMMARIZE) {
    return;
  }

  if (currentSummary && totalMessages - summarizedMessageCount < SUMMARY_REFRESH_INTERVAL) {
    return;
  }

  const summary = await generateConversationSummary({
    propertyTitle,
    previousSummary: currentSummary,
    messages: allMessages,
  });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('chat_conversas')
    .update({
      resumo: summary,
      metadata: {
        ...currentMetadata,
        resumo_message_count: totalMessages,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  if (error) {
    throw new Error(`Failed to update conversation summary: ${error.message}`);
  }
}

async function generateConversationSummary({
  propertyTitle,
  previousSummary,
  messages,
}: {
  propertyTitle: string;
  previousSummary: string | null;
  messages: StoredConversationMessage[];
}) {
  const response = await getOpenAIClient().responses.create({
    model: DEFAULT_MODEL,
    input: [
      {
        role: 'system',
        content: [
          'Voce vai resumir uma conversa entre cliente e assistente sobre um unico imovel.',
          `O imovel da conversa e "${propertyTitle}".`,
          'Produza um resumo curto em portugues do Brasil.',
          'Preserve fatos, preferencias, perguntas respondidas, pendencias e contexto util para a proxima resposta.',
          'Nao invente nada e nao repita texto desnecessario.',
          'Retorne no maximo 8 linhas curtas.',
        ].join(' '),
      },
      {
        role: 'user',
        content: [
          'Resumo anterior:',
          previousSummary?.trim() || 'Sem resumo anterior.',
          '',
          'Conversa completa ate agora:',
          formatStoredConversationHistory(messages),
        ].join('\n'),
      },
    ],
  });

  return (
    response.output_text?.trim() ||
    previousSummary?.trim() ||
    formatStoredConversationHistory(messages.slice(-RECENT_MESSAGES_FOR_PROMPT))
  );
}

function formatStoredConversationHistory(messages: StoredConversationMessage[]) {
  if (messages.length === 0) {
    return 'Sem historico anterior.';
  }

  return messages
    .map((message) => `${message.role === 'assistant' ? 'Assistente' : 'Cliente'}: ${message.content}`)
    .join('\n');
}

function getSummarizedMessageCount(metadata: Record<string, unknown>) {
  const rawValue = metadata.resumo_message_count;
  return typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeAssistantReply(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  return value
    .replace(/\bPosso ajudar com mais alguma informa[cç][aã]o\??/gi, '')
    .replace(/\bPosso ajudar com mais alguma coisa\??/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
