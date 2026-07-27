-- Adiciona telefone ao cadastro de usuarios e cria a agenda administrativa.
-- Aplicar no Supabase antes de usar cadastro publico e modulo de agenda.

alter table public.users
  add column if not exists telefone text;

create table if not exists public.agenda_eventos (
  id uuid not null default gen_random_uuid(),
  titulo text not null,
  descricao text,
  data_inicio timestamp with time zone not null,
  data_fim timestamp with time zone,
  status text not null default 'pendente',
  tipo text not null default 'geral',
  user_id uuid,
  imovel_id uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint agenda_eventos_pkey primary key (id),
  constraint agenda_eventos_user_id_fkey foreign key (user_id) references public.users(id),
  constraint agenda_eventos_imovel_id_fkey foreign key (imovel_id) references public.imoveis(id)
);

create index if not exists agenda_eventos_data_inicio_idx
  on public.agenda_eventos (data_inicio);

create index if not exists agenda_eventos_status_idx
  on public.agenda_eventos (status);
