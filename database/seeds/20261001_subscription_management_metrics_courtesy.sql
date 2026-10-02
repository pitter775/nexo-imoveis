-- Complemento: aplicar apos 20261001_subscription_management.sql.
-- As funcoes abaixo ainda nao existiam na verificacao do Supabase.
begin;
create or replace function public.conceder_cortesia_assinatura(
  p_email text, p_administrador uuid, p_motivo text, p_ate timestamptz
) returns uuid language plpgsql set search_path = public as $$
declare v_usuario uuid; v_assinatura uuid;
begin
  select id into strict v_usuario from public.users where lower(email) = lower(trim(p_email)) and ativo = true;
  perform pg_advisory_xact_lock(hashtextextended(v_usuario::text, 0));
  select id into v_assinatura from public.assinaturas where user_id = v_usuario order by created_at desc limit 1;
  if v_assinatura is null then
    insert into public.assinaturas(user_id, provider, valor, status)
      values(v_usuario, 'cortesia', 119, 'pendente') returning id into v_assinatura;
  end if;
  perform public.alterar_acesso_assinatura(v_assinatura, p_administrador, 'conceder', p_motivo, p_ate);
  return v_assinatura;
end;
$$;
revoke all on function public.conceder_cortesia_assinatura(text, uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function public.conceder_cortesia_assinatura(text, uuid, text, timestamptz) to service_role;

create or replace function public.metricas_assinaturas()
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'ativas', (select count(*) from public.assinaturas a where a.provider = 'mercado_pago'
      and a.status not in ('cancelada', 'pausada') and exists (select 1 from public.assinatura_cobrancas c
        where c.assinatura_id = a.id and c.status = 'pago' and c.vencimento <= now() and c.periodo_fim > now())),
    'previsao', (select coalesce(sum(a.valor),0) from public.assinaturas a where a.provider = 'mercado_pago'
      and a.status not in ('cancelada', 'pausada') and exists (select 1 from public.assinatura_cobrancas c
        where c.assinatura_id = a.id and c.status = 'pago' and c.vencimento <= now() and c.periodo_fim > now())),
    'recebido', (select coalesce(sum(valor),0) from public.assinatura_cobrancas where status = 'pago'),
    'pagas', (select count(*) from public.assinatura_cobrancas where status = 'pago')
  );
$$;
revoke all on function public.metricas_assinaturas() from public, anon, authenticated;
grant execute on function public.metricas_assinaturas() to service_role;
commit;
