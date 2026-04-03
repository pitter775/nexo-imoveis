create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  origem text not null,
  nivel text not null default 'info',
  etapa text,
  contexto text,
  imovel_id uuid references public.imoveis(id) on delete set null,
  arquivo_id uuid references public.imovel_arquivos(id) on delete set null,
  mensagem text not null,
  detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_logs_created_at_idx
  on public.admin_logs (created_at desc);

create index if not exists admin_logs_origem_idx
  on public.admin_logs (origem);

create index if not exists admin_logs_imovel_id_idx
  on public.admin_logs (imovel_id);

create index if not exists admin_logs_arquivo_id_idx
  on public.admin_logs (arquivo_id);
