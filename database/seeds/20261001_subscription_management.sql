-- Aplicar no Supabase antes de ativar SUBSCRIPTION_MANAGEMENT_ENABLED.
-- Nao altera periodos pagos existentes nem presume pagamento de assinatura autorizada.
begin;

alter table public.assinaturas
  add column if not exists plano text not null default 'Mensal',
  add column if not exists metodo text,
  add column if not exists proxima_cobranca timestamptz,
  add column if not exists pago_ate timestamptz,
  add column if not exists provider_updated_at timestamptz,
  add column if not exists checkout_url text,
  add column if not exists conciliado_em timestamptz,
  add column if not exists erro_conciliacao text,
  add column if not exists acesso_manual text check (acesso_manual in ('concedido', 'suspenso')),
  add column if not exists acesso_manual_ate timestamptz;

create table if not exists public.assinatura_cobrancas (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid not null references public.assinaturas(id),
  referencia_gateway text not null unique,
  pagamento_gateway text,
  status text not null,
  valor numeric(12,2) not null check (valor >= 0),
  moeda text not null default 'BRL',
  metodo text,
  vencimento timestamptz not null,
  periodo_fim timestamptz not null,
  pago_em timestamptz,
  provider_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assinatura_cobrancas_historico
  on public.assinatura_cobrancas(assinatura_id, vencimento desc);
create index if not exists assinatura_cobrancas_pagamento
  on public.assinatura_cobrancas(pagamento_gateway);

create table if not exists public.assinatura_auditoria (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid not null references public.assinaturas(id),
  administrador_id uuid not null references public.users(id),
  acao text not null check (acao in ('conceder', 'suspender', 'reativar')),
  motivo text not null check (length(trim(motivo)) >= 5),
  estado_anterior jsonb not null,
  estado_novo jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists assinatura_auditoria_historico
  on public.assinatura_auditoria(assinatura_id, created_at desc);

create table if not exists public.assinatura_avisos (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid not null references public.assinaturas(id),
  referencia_gateway text not null,
  tipo text not null check (tipo in ('recusado', 'pago')),
  enviado_em timestamptz,
  reservado_ate timestamptz,
  created_at timestamptz not null default now(),
  unique(referencia_gateway, tipo)
);
alter table public.assinatura_avisos enable row level security;
revoke all on public.assinatura_avisos from anon, authenticated;
grant all on public.assinatura_avisos to service_role;

-- Autenticacao da NEXO usa sessao propria; acesso ocorre somente pelo servidor.
alter table public.assinatura_cobrancas enable row level security;
alter table public.assinatura_auditoria enable row level security;
revoke all on public.assinatura_cobrancas, public.assinatura_auditoria from anon, authenticated;
grant all on public.assinatura_cobrancas, public.assinatura_auditoria to service_role;

-- Bloqueia a assinatura para que cobrancas concorrentes nao percam atualizacoes.
create or replace function public.sync_assinatura_cobranca(p_cobranca jsonb)
returns void language plpgsql set search_path = public as $$
declare
  v_assinatura public.assinaturas;
  v_referencia text := p_cobranca->>'referencia_gateway';
begin
  select * into strict v_assinatura from public.assinaturas
    where id = (p_cobranca->>'assinatura_id')::uuid for update;
  if (p_cobranca->>'moeda') <> 'BRL' or
     (p_cobranca->>'valor')::numeric <> v_assinatura.valor then
    raise exception 'Valor ou moeda divergente';
  end if;
  if exists (select 1 from public.assinatura_cobrancas
    where referencia_gateway = v_referencia and assinatura_id <> v_assinatura.id) then
    raise exception 'Cobranca vinculada a outra assinatura';
  end if;
  insert into public.assinatura_cobrancas (
    assinatura_id, referencia_gateway, pagamento_gateway, status, valor, moeda,
    metodo, vencimento, periodo_fim, pago_em, provider_updated_at
  ) values (
    v_assinatura.id, v_referencia, p_cobranca->>'pagamento_gateway',
    p_cobranca->>'status', (p_cobranca->>'valor')::numeric, p_cobranca->>'moeda',
    p_cobranca->>'metodo', (p_cobranca->>'vencimento')::timestamptz,
    (p_cobranca->>'periodo_fim')::timestamptz, (p_cobranca->>'pago_em')::timestamptz,
    (p_cobranca->>'provider_updated_at')::timestamptz
  ) on conflict (referencia_gateway) do update set
    pagamento_gateway = excluded.pagamento_gateway, status = excluded.status,
    metodo = excluded.metodo, pago_em = excluded.pago_em,
    provider_updated_at = excluded.provider_updated_at, updated_at = now()
    where excluded.provider_updated_at >= assinatura_cobrancas.provider_updated_at;

  update public.assinaturas set pago_ate = (
    select max(periodo_fim) from public.assinatura_cobrancas
    where assinatura_id = v_assinatura.id and status = 'pago'
  ), updated_at = now() where id = v_assinatura.id;

  -- O aviso acompanha o estado persistido, nunca um evento antigo descartado.
  insert into public.assinatura_avisos (assinatura_id, referencia_gateway, tipo)
    select assinatura_id, referencia_gateway, status from public.assinatura_cobrancas
    where referencia_gateway = v_referencia and status in ('recusado', 'pago')
    on conflict (referencia_gateway, tipo) do nothing;
end;
$$;

-- Auditoria e alteracao de acesso ocorrem na mesma transacao.
create or replace function public.alterar_acesso_assinatura(
  p_assinatura uuid, p_administrador uuid, p_acao text, p_motivo text, p_ate timestamptz
) returns void language plpgsql set search_path = public as $$
declare
  v_anterior public.assinaturas;
  v_novo public.assinaturas;
begin
  if not exists (select 1 from public.users where id = p_administrador
    and tipo_usuario = 'admin' and ativo = true) then
    raise exception 'Administrador invalido';
  end if;
  if p_acao not in ('conceder', 'suspender', 'reativar') or length(trim(p_motivo)) < 5 then
    raise exception 'Acao ou motivo invalido';
  end if;
  if p_acao = 'conceder' and (p_ate is null or p_ate <= now()) then
    raise exception 'Concessao exige validade futura';
  end if;
  select * into strict v_anterior from public.assinaturas where id = p_assinatura for update;
  update public.assinaturas set
    acesso_manual = case p_acao when 'conceder' then 'concedido' when 'suspender' then 'suspenso' else null end,
    acesso_manual_ate = case when p_acao = 'conceder' then p_ate else null end,
    updated_at = now()
    where id = p_assinatura returning * into v_novo;
  insert into public.assinatura_auditoria
    (assinatura_id, administrador_id, acao, motivo, estado_anterior, estado_novo)
    values (p_assinatura, p_administrador, p_acao, trim(p_motivo), to_jsonb(v_anterior), to_jsonb(v_novo));
end;
$$;
revoke all on function public.sync_assinatura_cobranca(jsonb) from public, anon, authenticated;
revoke all on function public.alterar_acesso_assinatura(uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.sync_assinatura_cobranca(jsonb) to service_role;
grant execute on function public.alterar_acesso_assinatura(uuid, uuid, text, text, timestamptz) to service_role;

create or replace function public.reservar_assinatura(p_usuario uuid, p_imovel uuid, p_email text, p_valor numeric)
returns jsonb language plpgsql set search_path = public as $$
declare v_assinatura public.assinaturas;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_usuario::text, 0));
  select * into v_assinatura from public.assinaturas
    where user_id = p_usuario and status not in ('cancelada', 'erro') and provider = 'mercado_pago'
    order by created_at desc limit 1;
  if found then return jsonb_build_object('id', v_assinatura.id, 'nova', false,
    'checkout_url', v_assinatura.checkout_url, 'mp_preapproval_id', v_assinatura.mp_preapproval_id); end if;
  insert into public.assinaturas(user_id, imovel_referencia_id, payer_email, valor)
    values(p_usuario, p_imovel, p_email, p_valor) returning * into v_assinatura;
  return jsonb_build_object('id', v_assinatura.id, 'nova', true);
end;
$$;
revoke all on function public.reservar_assinatura(uuid, uuid, text, numeric) from public, anon, authenticated;
grant execute on function public.reservar_assinatura(uuid, uuid, text, numeric) to service_role;
create or replace function public.reservar_avisos_assinatura()
returns setof public.assinatura_avisos language sql set search_path = public as $$
  update public.assinatura_avisos set reservado_ate = now() + interval '10 minutes'
    where id in (select id from public.assinatura_avisos where enviado_em is null
      and (reservado_ate is null or reservado_ate < now())
      order by created_at limit 20 for update skip locked) returning *;
$$;
revoke all on function public.reservar_avisos_assinatura() from public, anon, authenticated;
grant execute on function public.reservar_avisos_assinatura() to service_role;

commit;
