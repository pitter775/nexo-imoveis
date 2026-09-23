create table if not exists public.password_reset_tokens (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  token_hash text not null unique,
  redirect_to text,
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  constraint password_reset_tokens_pkey primary key (id),
  constraint password_reset_tokens_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade
);

create index if not exists password_reset_tokens_user_id_idx
  on public.password_reset_tokens(user_id);

create index if not exists password_reset_tokens_expires_at_idx
  on public.password_reset_tokens(expires_at);
