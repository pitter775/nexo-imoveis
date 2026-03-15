import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

type ChatConversationRecord = {
  id: string;
  user_id: string | null;
  imovel_id: string | null;
  tipo_chat: string;
  created_at: string;
};

type ChatMessageRecord = {
  id: string;
  conversa_id: string;
  modelo: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  custo_estimado: number | null;
  created_at: string;
};

type ImovelLookup = {
  id: string;
  titulo: string;
  cidade: string | null;
  estado: string | null;
};

type UserLookup = {
  id: string;
  nome: string | null;
  email: string;
};

export type IaTokensOverview = {
  currentMonthLabel: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalMessages: number;
  totalConversations: number;
  totalEstimatedCost: number;
  imoveisComConsumo: number;
  usuariosComConsumo: number;
  topImoveis: Array<{
    id: string;
    titulo: string;
    localizacao: string;
    messages: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  }>;
  topUsuarios: Array<{
    id: string;
    nome: string;
    email: string;
    messages: number;
    totalTokens: number;
    estimatedCost: number;
  }>;
  recentActivity: Array<{
    id: string;
    titulo: string;
    tipoChat: string;
    when: string;
    totalTokens: number;
    estimatedCost: number;
  }>;
};

const MODEL_PRICING_PER_MILLION: Record<
  string,
  {
    input: number;
    output: number;
  }
> = {
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
};

export async function getIaTokensOverview(): Promise<IaTokensOverview> {
  const supabase = createAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: conversations, error: conversationsError }, { data: messages, error: messagesError }] =
    await Promise.all([
      supabase
        .from('chat_conversas')
        .select('id, user_id, imovel_id, tipo_chat, created_at')
        .order('last_message_at', { ascending: false }),
      supabase
        .from('chat_mensagens')
        .select('id, conversa_id, modelo, tokens_input, tokens_output, custo_estimado, created_at')
        .gte('created_at', monthStart)
        .order('created_at', { ascending: false }),
    ]);

  if (conversationsError) {
    throw new Error(`Failed to load chat conversations: ${conversationsError.message}`);
  }

  if (messagesError) {
    throw new Error(`Failed to load chat messages: ${messagesError.message}`);
  }

  const conversationList = (conversations ?? []) as ChatConversationRecord[];
  const messageList = (messages ?? []) as ChatMessageRecord[];

  const conversationById = new Map(
    conversationList.map((conversation) => [conversation.id, conversation]),
  );

  const imovelIds = Array.from(
    new Set(
      conversationList
        .map((conversation) => conversation.imovel_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const userIds = Array.from(
    new Set(
      conversationList
        .map((conversation) => conversation.user_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [{ data: imoveis, error: imoveisError }, { data: users, error: usersError }] =
    await Promise.all([
      imovelIds.length
        ? supabase
            .from('imoveis')
            .select('id, titulo, cidade, estado')
            .in('id', imovelIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length
        ? supabase.from('users').select('id, nome, email').in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (imoveisError) {
    throw new Error(`Failed to load properties for IA tokens: ${imoveisError.message}`);
  }

  if (usersError) {
    throw new Error(`Failed to load users for IA tokens: ${usersError.message}`);
  }

  const imovelById = new Map(
    ((imoveis ?? []) as ImovelLookup[]).map((imovel) => [imovel.id, imovel]),
  );
  const userById = new Map(
    ((users ?? []) as UserLookup[]).map((user) => [user.id, user]),
  );

  const propertyAggregates = new Map<
    string,
    {
      id: string;
      titulo: string;
      localizacao: string;
      messages: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      estimatedCost: number;
    }
  >();

  const userAggregates = new Map<
    string,
    {
      id: string;
      nome: string;
      email: string;
      messages: number;
      totalTokens: number;
      estimatedCost: number;
    }
  >();

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalEstimatedCost = 0;

  for (const message of messageList) {
    const conversation = conversationById.get(message.conversa_id);

    if (!conversation) {
      continue;
    }

    const inputTokens = message.tokens_input ?? 0;
    const outputTokens = message.tokens_output ?? 0;
    const totalTokens = inputTokens + outputTokens;
    const estimatedCost = message.custo_estimado ?? estimateCost(message.modelo, inputTokens, outputTokens);

    totalInputTokens += inputTokens;
    totalOutputTokens += outputTokens;
    totalEstimatedCost += estimatedCost;

    if (conversation.imovel_id) {
      const imovel = imovelById.get(conversation.imovel_id);
      const current =
        propertyAggregates.get(conversation.imovel_id) ??
        {
          id: conversation.imovel_id,
          titulo: imovel?.titulo ?? 'Imovel removido',
          localizacao: [imovel?.cidade, imovel?.estado].filter(Boolean).join(' - ') || 'Localizacao nao informada',
          messages: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          estimatedCost: 0,
        };

      current.messages += 1;
      current.inputTokens += inputTokens;
      current.outputTokens += outputTokens;
      current.totalTokens += totalTokens;
      current.estimatedCost += estimatedCost;

      propertyAggregates.set(conversation.imovel_id, current);
    }

    if (conversation.user_id) {
      const user = userById.get(conversation.user_id);
      const current =
        userAggregates.get(conversation.user_id) ??
        {
          id: conversation.user_id,
          nome: user?.nome ?? 'Usuario sem nome',
          email: user?.email ?? 'sem-email@nexo.local',
          messages: 0,
          totalTokens: 0,
          estimatedCost: 0,
        };

      current.messages += 1;
      current.totalTokens += totalTokens;
      current.estimatedCost += estimatedCost;

      userAggregates.set(conversation.user_id, current);
    }
  }

  const recentActivity = messageList.slice(0, 8).map((message) => {
    const conversation = conversationById.get(message.conversa_id);
    const imovel =
      conversation?.imovel_id != null
        ? imovelById.get(conversation.imovel_id)
        : null;
    const inputTokens = message.tokens_input ?? 0;
    const outputTokens = message.tokens_output ?? 0;

    return {
      id: message.id,
      titulo: imovel?.titulo ?? 'Chat sem imovel vinculado',
      tipoChat: conversation?.tipo_chat ?? 'indefinido',
      when: message.created_at,
      totalTokens: inputTokens + outputTokens,
      estimatedCost:
        message.custo_estimado ??
        estimateCost(message.modelo, inputTokens, outputTokens),
    };
  });

  return {
    currentMonthLabel: new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
    }).format(now),
    totalInputTokens,
    totalOutputTokens,
    totalTokens: totalInputTokens + totalOutputTokens,
    totalMessages: messageList.length,
    totalConversations: new Set(messageList.map((message) => message.conversa_id)).size,
    totalEstimatedCost,
    imoveisComConsumo: propertyAggregates.size,
    usuariosComConsumo: userAggregates.size,
    topImoveis: Array.from(propertyAggregates.values()).sort(
      (left, right) => right.totalTokens - left.totalTokens,
    ),
    topUsuarios: Array.from(userAggregates.values()).sort(
      (left, right) => right.totalTokens - left.totalTokens,
    ),
    recentActivity,
  };
}

function estimateCost(model: string | null, inputTokens: number, outputTokens: number) {
  const pricing = model ? MODEL_PRICING_PER_MILLION[model] : undefined;

  if (!pricing) {
    return 0;
  }

  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  );
}
