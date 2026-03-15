-- extensão para gerar UUID
create extension if not exists "pgcrypto";

----------------------------------------------------
-- USERS
----------------------------------------------------

create table users (
  id uuid primary key default gen_random_uuid(),
  nome text,
  email text unique not null,
  senha_hash text,
  tipo_usuario text default 'cliente',
  ativo boolean default true,
  created_at timestamp with time zone default now()
);

----------------------------------------------------
-- IMOVEIS
----------------------------------------------------

create table imoveis (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  tipo_leilao text,
  tipo_propriedade text,
  valor_avaliacao numeric,
  valor_minimo numeric,
  quartos integer,
  banheiros integer,
  area_total numeric,
  area_construida numeric,
  ano_construcao integer,
  rua text,
  numero text,
  complemento text,
  cidade text,
  estado text,
  cep text,
  data_leilao timestamp,
  status text default 'ativo',
  created_at timestamp with time zone default now()
);

----------------------------------------------------
-- IMAGENS DO IMOVEL
----------------------------------------------------

create table imovel_imagens (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid references imoveis(id) on delete cascade,
  url text not null,
  ordem integer default 0,
  created_at timestamp with time zone default now()
);

----------------------------------------------------
-- ARQUIVOS DO IMOVEL
----------------------------------------------------

create table imovel_arquivos (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid references imoveis(id) on delete cascade,
  nome_arquivo text,
  url_storage text,
  tipo_arquivo text,
  visivel_pagantes boolean default true,
  created_at timestamp with time zone default now()
);

----------------------------------------------------
-- PAGAMENTOS
----------------------------------------------------

create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  valor numeric,
  metodo text,
  status text default 'pendente',
  referencia_gateway text,
  created_at timestamp with time zone default now()
);

----------------------------------------------------
-- ITENS DO PAGAMENTO
----------------------------------------------------

create table pagamentos_itens (
  id uuid primary key default gen_random_uuid(),
  pagamento_id uuid references pagamentos(id) on delete cascade,
  imovel_id uuid references imoveis(id),
  valor numeric,
  created_at timestamp with time zone default now()
);

----------------------------------------------------
-- ACESSO A IMOVEIS COMPRADOS
----------------------------------------------------

create table user_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  imovel_id uuid references imoveis(id),
  data_compra timestamp default now(),
  data_expiracao timestamp,
  status text default 'ativo',
  created_at timestamp with time zone default now()
);

----------------------------------------------------
-- HISTORICO DE ACESSO
----------------------------------------------------

create table historico_acessos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  imovel_id uuid references imoveis(id),
  acao text,
  ip text,
  created_at timestamp with time zone default now()
);

----------------------------------------------------
-- CHAT IA
----------------------------------------------------

create table chat_ia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  imovel_id uuid references imoveis(id),
  mensagem_usuario text,
  resposta_ia text,
  created_at timestamp with time zone default now()
);

----------------------------------------------------
-- LEILOES
----------------------------------------------------

create table leiloes (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid references imoveis(id),
  data_inicio timestamp,
  data_fim timestamp,
  valor_inicial numeric,
  status text,
  created_at timestamp with time zone default now()
);
