import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

type CountResponse = {
  count: number | null;
};

type RevenueResponse = {
  valor: number | null;
};

type AccessTrendRow = {
  created_at: string | null;
};

type AccessActivityRow = {
  id: string;
  acao: string | null;
  created_at: string | null;
  user_id: string | null;
  imovel_id: string | null;
};

type ChatMessageRow = {
  conversa_id: string;
  created_at: string;
  tokens_input: number | null;
  tokens_output: number | null;
};

type TopImovelRow = {
  imovel_id: string | null;
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

export type AdminDashboardData = {
  metrics: {
    totalUsers: number;
    totalImoveisAtivos: number;
    totalAcessosAtivos: number;
    receitaAprovada: number;
    conversasIaMes: number;
    tokensMes: number;
  };
  trend: Array<{
    label: string;
    total: number;
  }>;
  topImoveis: Array<{
    id: string;
    titulo: string;
    localizacao: string;
    total: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    when: string | null;
    userLabel: string;
    imovelLabel: string;
  }>;
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = createAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

  const [
    totalUsersResponse,
    totalImoveisAtivosResponse,
    totalAcessosAtivosResponse,
    pagamentosResponse,
    chatsMonthResponse,
    accessTrendResponse,
    recentActivityResponse,
    topImoveisResponse,
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase
      .from('imoveis')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo'),
    supabase
      .from('user_access')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo'),
    supabase
      .from('pagamentos')
      .select('valor')
      .in('status', ['pago', 'aprovado', 'concluido']),
    supabase
      .from('chat_mensagens')
      .select('conversa_id, created_at, tokens_input, tokens_output')
      .gte('created_at', monthStart),
    supabase
      .from('historico_acessos')
      .select('created_at')
      .gte('created_at', sixMonthsAgo),
    supabase
      .from('historico_acessos')
      .select('id, acao, created_at, user_id, imovel_id')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('historico_acessos')
      .select('imovel_id')
      .not('imovel_id', 'is', null),
  ]);

  throwIfError(totalUsersResponse.error, 'users count');
  throwIfError(totalImoveisAtivosResponse.error, 'active properties count');
  throwIfError(totalAcessosAtivosResponse.error, 'active access count');
  throwIfError(pagamentosResponse.error, 'payments');
  throwIfError(chatsMonthResponse.error, 'chat month');
  throwIfError(accessTrendResponse.error, 'access trend');
  throwIfError(recentActivityResponse.error, 'recent activity');
  throwIfError(topImoveisResponse.error, 'top properties');

  const recentActivity = (recentActivityResponse.data ?? []) as AccessActivityRow[];
  const topImoveisRows = (topImoveisResponse.data ?? []) as TopImovelRow[];

  const relatedImovelIds = Array.from(
    new Set(
      [...recentActivity.map((item) => item.imovel_id), ...topImoveisRows.map((item) => item.imovel_id)].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  );
  const relatedUserIds = Array.from(
    new Set(
      recentActivity
        .map((item) => item.user_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [imoveisLookupResponse, usersLookupResponse] = await Promise.all([
    relatedImovelIds.length
      ? supabase
          .from('imoveis')
          .select('id, titulo, cidade, estado')
          .in('id', relatedImovelIds)
      : Promise.resolve({ data: [], error: null }),
    relatedUserIds.length
      ? supabase.from('users').select('id, nome, email').in('id', relatedUserIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  throwIfError(imoveisLookupResponse.error, 'properties lookup');
  throwIfError(usersLookupResponse.error, 'users lookup');

  const imovelById = new Map(
    ((imoveisLookupResponse.data ?? []) as ImovelLookup[]).map((item) => [item.id, item]),
  );
  const userById = new Map(
    ((usersLookupResponse.data ?? []) as UserLookup[]).map((item) => [item.id, item]),
  );

  const receitaAprovada = ((pagamentosResponse.data ?? []) as RevenueResponse[]).reduce(
    (sum, item) => sum + Number(item.valor ?? 0),
    0,
  );

  const chatMessages = (chatsMonthResponse.data ?? []) as ChatMessageRow[];
  const tokensMes = chatMessages.reduce(
    (sum, item) => sum + (item.tokens_input ?? 0) + (item.tokens_output ?? 0),
    0,
  );

  const trendBuckets = new Map<string, number>();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const label = new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
    }).format(date);
    trendBuckets.set(label, 0);
  }

  for (const row of (accessTrendResponse.data ?? []) as AccessTrendRow[]) {
    if (!row.created_at) {
      continue;
    }

    const label = new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
    }).format(new Date(row.created_at));

    if (trendBuckets.has(label)) {
      trendBuckets.set(label, (trendBuckets.get(label) ?? 0) + 1);
    }
  }

  const propertyTotals = new Map<string, number>();
  for (const row of topImoveisRows) {
    if (!row.imovel_id) {
      continue;
    }
    propertyTotals.set(row.imovel_id, (propertyTotals.get(row.imovel_id) ?? 0) + 1);
  }

  return {
    metrics: {
      totalUsers: totalUsersResponse.count ?? 0,
      totalImoveisAtivos: totalImoveisAtivosResponse.count ?? 0,
      totalAcessosAtivos: totalAcessosAtivosResponse.count ?? 0,
      receitaAprovada,
      conversasIaMes: new Set(chatMessages.map((item) => item.conversa_id)).size,
      tokensMes,
    },
    trend: Array.from(trendBuckets.entries()).map(([label, total]) => ({
      label: label.replace('.', ''),
      total,
    })),
    topImoveis: Array.from(propertyTotals.entries())
      .map(([id, total]) => {
        const imovel = imovelById.get(id);
        return {
          id,
          titulo: imovel?.titulo ?? 'Imovel removido',
          localizacao:
            [imovel?.cidade, imovel?.estado].filter(Boolean).join(' - ') ||
            'Localizacao nao informada',
          total,
        };
      })
      .sort((left, right) => right.total - left.total)
      .slice(0, 5),
    recentActivity: recentActivity.map((item) => ({
      id: item.id,
      action: item.acao ?? 'Acesso',
      when: item.created_at,
      userLabel: formatUserLabel(userById.get(item.user_id ?? '')),
      imovelLabel: imovelById.get(item.imovel_id ?? '')?.titulo ?? 'Imovel nao identificado',
    })),
  };
}

function throwIfError(error: { message: string } | null, label: string) {
  if (error) {
    throw new Error(`Failed to load ${label}: ${error.message}`);
  }
}

function formatUserLabel(user: UserLookup | undefined) {
  if (!user) {
    return 'Usuario nao identificado';
  }

  return user.nome?.trim() || user.email;
}
