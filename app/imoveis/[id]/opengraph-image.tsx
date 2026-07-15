import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Imovel em leilao na Nexo Leiloes';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

type OpenGraphImageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PropertyRow = {
  titulo: string;
  cidade: string | null;
  estado: string | null;
  tipo_propriedade: string | null;
  valor_avaliacao: number | null;
  valor_minimo: number | null;
  valor_primeiro_leilao: number | null;
  valor_segundo_leilao: number | null;
};

type PropertyImageRow = {
  url: string | null;
};

function formatCurrency(value: number | null | undefined) {
  if (value == null) {
    return 'Consulte a oportunidade';
  }

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

async function fetchSupabaseRows<T>(path: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return [];
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as T[];
}

export default async function OpenGraphImage({ params }: OpenGraphImageProps) {
  const { id } = await params;
  const encodedId = encodeURIComponent(id);

  const [properties, images] = await Promise.all([
    fetchSupabaseRows<PropertyRow>(
      `imoveis?select=titulo,cidade,estado,tipo_propriedade,valor_avaliacao,valor_minimo,valor_primeiro_leilao,valor_segundo_leilao&id=eq.${encodedId}&limit=1`,
    ),
    fetchSupabaseRows<PropertyImageRow>(
      `imovel_imagens?select=url&imovel_id=eq.${encodedId}&order=ordem.asc&limit=1`,
    ),
  ]);

  const property = properties[0];
  const imageUrl = images[0]?.url;
  const title = property?.titulo ?? 'Imovel em leilao';
  const location = [property?.cidade, property?.estado].filter(Boolean).join(' - ');
  const propertyType = property?.tipo_propriedade ?? 'Oportunidade imobiliaria';
  const price =
    property?.valor_segundo_leilao ??
    property?.valor_primeiro_leilao ??
    property?.valor_minimo ??
    property?.valor_avaliacao;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#f6f7f8',
          color: '#0f172a',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : null}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.76) 44%, rgba(15,23,42,0.22) 100%)',
            }}
          />
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '64%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '58px 64px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                color: '#ffffff',
                fontSize: 30,
                fontWeight: 800,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: '#ff6a00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                N
              </div>
              Nexo Leiloes
            </div>
            <div
              style={{
                display: 'flex',
                width: 'fit-content',
                borderRadius: 999,
                background: '#ff6a00',
                color: '#ffffff',
                padding: '10px 18px',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {propertyType}
            </div>
            <div
              style={{
                color: '#ffffff',
                fontSize: 58,
                lineHeight: 1.05,
                fontWeight: 900,
                maxWidth: 690,
              }}
            >
              {title}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ color: '#fed7aa', fontSize: 34, fontWeight: 800 }}>
              {formatCurrency(price)}
            </div>
            <div style={{ color: '#e2e8f0', fontSize: 26, fontWeight: 600 }}>
              {location || 'Imovel selecionado pela Nexo'}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
