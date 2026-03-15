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

  const recentMessages = await listRecentMessages(activeConversationId, 6);
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
          'Historico recente da conversa:',
          formatConversationHistory(recentMessages),
          '',
          `Pergunta atual do cliente: ${question}`,
        ].join('\n'),
      },
    ],
  });

  const reply =
    response.output_text?.trim() ||
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
    })
    .eq('id', activeConversationId);

  return {
    conversationId: activeConversationId,
    reply,
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
      status: 'ativa',
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return data.id as string;
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
