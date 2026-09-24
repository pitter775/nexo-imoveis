import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

type PaymentRow = {
  id: string;
  user_id: string | null;
  valor: number | null;
  metodo: string | null;
  status: string | null;
  referencia_gateway: string | null;
  created_at: string | null;
};

type PaymentItemRow = {
  pagamento_id: string | null;
  imovel_id: string | null;
  valor: number | null;
};

type AccessRow = {
  id: string;
  user_id: string | null;
  imovel_id: string | null;
  data_compra: string | null;
  data_expiracao: string | null;
  status: string | null;
  created_at: string | null;
};

type SubscriptionRow = {
  id: string;
  user_id: string | null;
  imovel_referencia_id: string | null;
  status: string | null;
  provider: string | null;
  mp_preapproval_id: string | null;
  payer_email: string | null;
  valor: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  created_at: string | null;
};

type UserLookup = {
  id: string;
  nome: string | null;
  email: string;
};

type ImovelLookup = {
  id: string;
  titulo: string;
  cidade: string | null;
  estado: string | null;
};

export type AdminPagamentoItem = {
  id: string;
  userLabel: string;
  userEmail: string;
  imovelLabel: string;
  imovelLocation: string;
  valor: number;
  itemValor: number;
  metodo: string;
  status: string;
  gatewayReference: string | null;
  createdAt: string | null;
  hasAccess: boolean;
};

type MappedPagamentoItem = AdminPagamentoItem & {
  userId: string | null;
  imovelId: string | null;
};

export type AdminPagamentoAccess = {
  id: string;
  userLabel: string;
  imovelLabel: string;
  status: string;
  dataCompra: string | null;
  dataExpiracao: string | null;
};

export type AdminAssinaturaItem = {
  id: string;
  userLabel: string;
  userEmail: string;
  imovelReferenciaLabel: string;
  status: string;
  provider: string;
  gatewayReference: string | null;
  valor: number;
  dataInicio: string | null;
  dataFim: string | null;
  createdAt: string | null;
};

export type AdminPagamentosData = {
  metrics: {
    totalReceita: number;
    receitaRecorrenteAtiva: number;
    totalPago: number;
    totalPendente: number;
    totalFalhou: number;
    acessosAtivos: number;
    assinaturasAtivas: number;
    ticketMedio: number;
  };
  statusCounts: Array<{
    status: string;
    total: number;
    valor: number;
  }>;
  pagamentos: AdminPagamentoItem[];
  acessosRecentes: AdminPagamentoAccess[];
  assinaturasRecentes: AdminAssinaturaItem[];
};

const PAID_STATUSES = new Set(['pago', 'aprovado', 'concluido', 'approved']);
const PENDING_STATUSES = new Set(['pendente', 'pending', 'em_analise', 'in_process']);
const FAILED_STATUSES = new Set(['erro', 'recusado', 'cancelado', 'estornado', 'failure', 'rejected']);

export async function getAdminPagamentosData(): Promise<AdminPagamentosData> {
  const supabase = createAdminClient();

  const [pagamentosResponse, itensResponse, acessosResponse, assinaturasResponse] = await Promise.all([
    supabase
      .from('pagamentos')
      .select('id, user_id, valor, metodo, status, referencia_gateway, created_at')
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(80),
    supabase
      .from('pagamentos_itens')
      .select('pagamento_id, imovel_id, valor')
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(160),
    supabase
      .from('user_access')
      .select('id, user_id, imovel_id, data_compra, data_expiracao, status, created_at')
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(80),
    supabase
      .from('assinaturas')
      .select(
        'id, user_id, imovel_referencia_id, status, provider, mp_preapproval_id, payer_email, valor, data_inicio, data_fim, created_at',
      )
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(80),
  ]);

  throwIfError(pagamentosResponse.error, 'pagamentos');
  throwIfError(itensResponse.error, 'itens de pagamento');
  throwIfError(acessosResponse.error, 'acessos comprados');
  throwIfError(assinaturasResponse.error, 'assinaturas');

  const pagamentos = (pagamentosResponse.data ?? []) as PaymentRow[];
  const itens = (itensResponse.data ?? []) as PaymentItemRow[];
  const acessos = (acessosResponse.data ?? []) as AccessRow[];
  const assinaturas = (assinaturasResponse.data ?? []) as SubscriptionRow[];
  const itemByPagamentoId = new Map(
    itens
      .filter((item) => item.pagamento_id)
      .map((item) => [item.pagamento_id as string, item]),
  );

  const userIds = uniqueStrings([
    ...pagamentos.map((item) => item.user_id),
    ...acessos.map((item) => item.user_id),
    ...assinaturas.map((item) => item.user_id),
  ]);
  const imovelIds = uniqueStrings([
    ...itens.map((item) => item.imovel_id),
    ...acessos.map((item) => item.imovel_id),
    ...assinaturas.map((item) => item.imovel_referencia_id),
  ]);

  const [usersResponse, imoveisResponse] = await Promise.all([
    userIds.length
      ? supabase.from('users').select('id, nome, email').in('id', userIds)
      : Promise.resolve({ data: [], error: null }),
    imovelIds.length
      ? supabase.from('imoveis').select('id, titulo, cidade, estado').in('id', imovelIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  throwIfError(usersResponse.error, 'usuarios');
  throwIfError(imoveisResponse.error, 'imoveis');

  const userById = new Map(((usersResponse.data ?? []) as UserLookup[]).map((item) => [item.id, item]));
  const imovelById = new Map(
    ((imoveisResponse.data ?? []) as ImovelLookup[]).map((item) => [item.id, item]),
  );
  const activeAccessKey = new Set(
    acessos
      .filter((item) => item.user_id && item.imovel_id && normalizeStatus(item.status) === 'ativo')
      .map((item) => `${item.user_id}:${item.imovel_id}`),
  );

  const acessosAtivos = acessos.filter((item) => normalizeStatus(item.status) === 'ativo').length;
  const assinaturasAtivas = assinaturas.filter((item) =>
    ['ativa', 'active', 'authorized'].includes(normalizeStatus(item.status)),
  ).length;
  const receitaRecorrenteAtiva = assinaturas
    .filter((item) => ['ativa', 'active', 'authorized'].includes(normalizeStatus(item.status)))
    .reduce((sum, item) => sum + Number(item.valor ?? 0), 0);
  const mappedPagamentos = pagamentos.map((pagamento): MappedPagamentoItem => {
    const item = itemByPagamentoId.get(pagamento.id);
    const user = userById.get(pagamento.user_id ?? '');
    const imovel = imovelById.get(item?.imovel_id ?? '');
    const status = normalizeStatus(pagamento.status);
    const hasAccess =
      Boolean(pagamento.user_id && item?.imovel_id) &&
      activeAccessKey.has(`${pagamento.user_id}:${item?.imovel_id}`);

    return {
      id: pagamento.id,
      userId: pagamento.user_id,
      imovelId: item?.imovel_id ?? null,
      userLabel: formatUserLabel(user),
      userEmail: user?.email ?? 'Email nao identificado',
      imovelLabel: imovel?.titulo ?? 'Imovel nao identificado',
      imovelLocation: formatLocation(imovel),
      valor: Number(pagamento.valor ?? 0),
      itemValor: Number(item?.valor ?? pagamento.valor ?? 0),
      metodo: pagamento.metodo ?? 'nao informado',
      status,
      gatewayReference: pagamento.referencia_gateway,
      createdAt: pagamento.created_at,
      hasAccess,
    };
  });
  const visiblePagamentos = mappedPagamentos.filter(
    (pagamento) => !(PENDING_STATUSES.has(pagamento.status) && pagamento.hasAccess),
  );
  const statusBuckets = new Map<string, { total: number; valor: number }>();
  let totalReceita = 0;
  let totalPago = 0;
  let totalPendente = 0;
  let totalFalhou = 0;

  for (const pagamento of visiblePagamentos) {
    const bucket = statusBuckets.get(pagamento.status) ?? { total: 0, valor: 0 };
    bucket.total += 1;
    bucket.valor += pagamento.valor;
    statusBuckets.set(pagamento.status, bucket);

    if (PAID_STATUSES.has(pagamento.status)) {
      totalReceita += pagamento.valor;
      totalPago += 1;
    } else if (PENDING_STATUSES.has(pagamento.status)) {
      totalPendente += 1;
    } else if (FAILED_STATUSES.has(pagamento.status)) {
      totalFalhou += 1;
    }
  }

  return {
    metrics: {
      totalReceita,
      receitaRecorrenteAtiva,
      totalPago,
      totalPendente,
      totalFalhou,
      acessosAtivos,
      assinaturasAtivas,
      ticketMedio: totalPago > 0 ? totalReceita / totalPago : 0,
    },
    statusCounts: Array.from(statusBuckets.entries())
      .map(([status, bucket]) => ({
        status,
        total: bucket.total,
        valor: bucket.valor,
      }))
      .sort((left, right) => right.total - left.total),
    pagamentos: visiblePagamentos.map(({ userId, imovelId, ...pagamento }) => pagamento),
    acessosRecentes: acessos.slice(0, 8).map((access) => ({
      id: access.id,
      userLabel: formatUserLabel(userById.get(access.user_id ?? '')),
      imovelLabel: imovelById.get(access.imovel_id ?? '')?.titulo ?? 'Imovel nao identificado',
      status: normalizeStatus(access.status),
      dataCompra: access.data_compra ?? access.created_at,
      dataExpiracao: access.data_expiracao,
    })),
    assinaturasRecentes: assinaturas.slice(0, 8).map((assinatura) => {
      const imovel = imovelById.get(assinatura.imovel_referencia_id ?? '');
      const user = userById.get(assinatura.user_id ?? '');

      return {
        id: assinatura.id,
        userLabel: formatUserLabel(user),
        userEmail: user?.email ?? assinatura.payer_email ?? 'Email nao identificado',
        imovelReferenciaLabel: imovel?.titulo ?? 'Acesso total',
        status: normalizeStatus(assinatura.status),
        provider: assinatura.provider ?? 'mercado_pago',
        gatewayReference: assinatura.mp_preapproval_id,
        valor: Number(assinatura.valor ?? 0),
        dataInicio: assinatura.data_inicio,
        dataFim: assinatura.data_fim,
        createdAt: assinatura.created_at,
      };
    }),
  };
}

function throwIfError(error: { message: string } | null, label: string) {
  if (error) {
    throw new Error(`Failed to load ${label}: ${error.message}`);
  }
}

function normalizeStatus(status: string | null | undefined) {
  return status?.trim().toLowerCase() || 'pendente';
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function formatUserLabel(user: UserLookup | undefined) {
  if (!user) {
    return 'Usuario nao identificado';
  }

  return user.nome?.trim() || user.email;
}

function formatLocation(imovel: ImovelLookup | undefined) {
  if (!imovel) {
    return 'Localizacao nao informada';
  }

  return [imovel.cidade, imovel.estado].filter(Boolean).join(' - ') || 'Localizacao nao informada';
}
