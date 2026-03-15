alter table public.imoveis
  add column if not exists rua text,
  add column if not exists numero text,
  add column if not exists complemento text,
  add column if not exists cep text;

alter table public.imoveis
  drop constraint if exists imoveis_tipo_leilao_check;

alter table public.imoveis
  drop constraint if exists imoveis_status_check;

alter table public.imoveis
  drop constraint if exists imoveis_estado_check;
