-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.chat_ia (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  imovel_id uuid,
  mensagem_usuario text,
  resposta_ia text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_ia_pkey PRIMARY KEY (id),
  CONSTRAINT chat_ia_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT chat_ia_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id)
);
CREATE TABLE public.historico_acessos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  imovel_id uuid,
  acao text,
  ip text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT historico_acessos_pkey PRIMARY KEY (id),
  CONSTRAINT historico_acessos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT historico_acessos_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id)
);
CREATE TABLE public.imoveis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  tipo_leilao text,
  valor_avaliacao numeric,
  valor_minimo numeric,
  cidade text,
  estado text,
  data_leilao timestamp without time zone,
  status text DEFAULT 'ativo'::text,
  created_at timestamp with time zone DEFAULT now(),
  rua text,
  numero text,
  complemento text,
  cep text,
  tipo_propriedade text,
  quartos integer,
  banheiros integer,
  area_total numeric,
  area_construida numeric,
  ano_construcao integer,
  CONSTRAINT imoveis_pkey PRIMARY KEY (id)
);
CREATE TABLE public.imovel_arquivos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  imovel_id uuid,
  nome_arquivo text,
  url_storage text,
  tipo_arquivo text,
  visivel_pagantes boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  tipo_documento text,
  visivel_publico boolean DEFAULT false,
  CONSTRAINT imovel_arquivos_pkey PRIMARY KEY (id),
  CONSTRAINT imovel_arquivos_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id)
);
CREATE TABLE public.imovel_detalhes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  imovel_id uuid NOT NULL,
  resumo_executivo text,
  ocupacao text,
  matricula text,
  cartorio text,
  numero_processo text,
  valor_mercado numeric,
  lance_recomendado numeric,
  lucro_estimado numeric,
  roi_estimado numeric,
  divida_iptu numeric,
  divida_condominio numeric,
  analise text,
  riscos text,
  observacoes_juridicas text,
  estrategia text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT imovel_detalhes_pkey PRIMARY KEY (id),
  CONSTRAINT imovel_detalhes_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id)
);
CREATE TABLE public.imovel_imagens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  imovel_id uuid,
  url text NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT imovel_imagens_pkey PRIMARY KEY (id),
  CONSTRAINT imovel_imagens_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id)
);
CREATE TABLE public.leiloes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  imovel_id uuid,
  data_inicio timestamp without time zone,
  data_fim timestamp without time zone,
  valor_inicial numeric,
  status text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leiloes_pkey PRIMARY KEY (id),
  CONSTRAINT leiloes_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id)
);
CREATE TABLE public.pagamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  valor numeric,
  metodo text,
  status text DEFAULT 'pendente'::text,
  referencia_gateway text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pagamentos_pkey PRIMARY KEY (id),
  CONSTRAINT pagamentos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.pagamentos_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pagamento_id uuid,
  imovel_id uuid,
  valor numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pagamentos_itens_pkey PRIMARY KEY (id),
  CONSTRAINT pagamentos_itens_pagamento_id_fkey FOREIGN KEY (pagamento_id) REFERENCES public.pagamentos(id),
  CONSTRAINT pagamentos_itens_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id)
);
CREATE TABLE public.user_access (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  imovel_id uuid,
  data_compra timestamp without time zone DEFAULT now(),
  data_expiracao timestamp without time zone,
  status text DEFAULT 'ativo'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_access_pkey PRIMARY KEY (id),
  CONSTRAINT user_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_access_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text,
  email text NOT NULL UNIQUE,
  senha_hash text,
  tipo_usuario text DEFAULT 'cliente'::text,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);