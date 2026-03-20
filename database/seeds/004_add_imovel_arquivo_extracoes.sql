CREATE TABLE IF NOT EXISTS public.imovel_arquivo_extracoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  arquivo_id uuid NOT NULL UNIQUE,
  imovel_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  texto_extraido text,
  resumo text,
  campos_extraidos jsonb NOT NULL DEFAULT '{}'::jsonb,
  erro text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT imovel_arquivo_extracoes_pkey PRIMARY KEY (id),
  CONSTRAINT imovel_arquivo_extracoes_arquivo_id_fkey
    FOREIGN KEY (arquivo_id) REFERENCES public.imovel_arquivos(id) ON DELETE CASCADE,
  CONSTRAINT imovel_arquivo_extracoes_imovel_id_fkey
    FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_imovel_arquivo_extracoes_imovel_id
  ON public.imovel_arquivo_extracoes(imovel_id);

CREATE INDEX IF NOT EXISTS idx_imovel_arquivo_extracoes_status
  ON public.imovel_arquivo_extracoes(status);

CREATE OR REPLACE FUNCTION public.set_imovel_arquivo_extracoes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_imovel_arquivo_extracoes_updated_at
ON public.imovel_arquivo_extracoes;

CREATE TRIGGER trg_imovel_arquivo_extracoes_updated_at
BEFORE UPDATE ON public.imovel_arquivo_extracoes
FOR EACH ROW
EXECUTE FUNCTION public.set_imovel_arquivo_extracoes_updated_at();
