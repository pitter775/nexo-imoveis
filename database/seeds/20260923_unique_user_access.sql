WITH ranked_user_access AS (
  SELECT
    ctid,
    row_number() OVER (
      PARTITION BY user_id, imovel_id, status
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS row_number
  FROM public.user_access
  WHERE user_id IS NOT NULL
    AND imovel_id IS NOT NULL
    AND status IS NOT NULL
)
DELETE FROM public.user_access
USING ranked_user_access
WHERE public.user_access.ctid = ranked_user_access.ctid
  AND ranked_user_access.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS user_access_unique_user_imovel_status_idx
ON public.user_access (user_id, imovel_id, status)
WHERE user_id IS NOT NULL
  AND imovel_id IS NOT NULL
  AND status IS NOT NULL;
