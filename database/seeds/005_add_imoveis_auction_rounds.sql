ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS data_primeiro_leilao timestamp without time zone,
  ADD COLUMN IF NOT EXISTS valor_primeiro_leilao numeric,
  ADD COLUMN IF NOT EXISTS data_segundo_leilao timestamp without time zone,
  ADD COLUMN IF NOT EXISTS valor_segundo_leilao numeric;

UPDATE public.imoveis
SET
  data_primeiro_leilao = COALESCE(data_primeiro_leilao, data_leilao),
  valor_primeiro_leilao = COALESCE(valor_primeiro_leilao, valor_minimo)
WHERE data_primeiro_leilao IS NULL
   OR valor_primeiro_leilao IS NULL;
