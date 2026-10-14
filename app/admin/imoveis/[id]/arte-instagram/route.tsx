import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getImovelById, listImovelImages } from '@/lib/admin/imoveis';
import { SITE_NAME } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function formatCurrency(value: number | null | undefined) {
  if (value == null) return 'Consulte condições';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function formatPropertyType(value: string | null) {
  if (!value) return 'Oportunidade imobiliária';
  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1);
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  await requireAdmin();
  const { id } = await params;
  const [property, images] = await Promise.all([
    getImovelById(id),
    listImovelImages(id),
  ]);

  if (!property) return new Response('Imóvel não encontrado.', { status: 404 });

  const requestedImageIndex = Number.parseInt(request.nextUrl.searchParams.get('image') ?? '0', 10);
  const imageIndex = Number.isInteger(requestedImageIndex)
    ? Math.max(0, Math.min(requestedImageIndex, Math.max(images.length - 1, 0)))
    : 0;
  const cover = images[imageIndex]?.url ?? images[0]?.url;
  const location = [property.cidade, property.estado].filter(Boolean).join(' · ');
  const price =
    property.valor_segundo_leilao ??
    property.valor_primeiro_leilao ??
    property.valor_minimo ??
    property.valor_avaliacao;
  const filename = `nexo-imovel-${id}.png`;
  const download = request.nextUrl.searchParams.get('download') === '1';
  const displayTitle = property.titulo.length > 66
    ? `${property.titulo.slice(0, 63).trimEnd()}…`
    : property.titulo;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: '#101827',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            width: '57%',
            height: '100%',
            background: 'linear-gradient(135deg, #26384d, #101827)',
          }}
        >
          {cover ? (
            <img
              src={cover}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : null}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              background: 'linear-gradient(180deg, rgba(8,18,32,0.25), transparent 38%, rgba(8,18,32,0.55))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 34,
              bottom: 34,
              display: 'flex',
              borderRadius: 999,
              padding: '13px 20px',
              background: 'rgba(8,18,32,0.82)',
              color: '#ffffff',
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            OPORTUNIDADE NEXO
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '43%',
            height: '100%',
            padding: '38px 40px',
            backgroundColor: '#101827',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f97316',
                color: '#ffffff',
                fontSize: 35,
                fontWeight: 900,
              }}
            >
              N
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', color: '#ffffff', fontSize: 27, fontWeight: 800 }}>{SITE_NAME}</div>
              <div style={{ display: 'flex', color: '#cbd5e1', fontSize: 13, fontWeight: 700, letterSpacing: 3 }}>LEILÕES IMOBILIÁRIOS</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                borderRadius: 999,
                padding: '11px 17px',
                background: '#26384d',
                color: '#fdba74',
                fontSize: 17,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {formatPropertyType(property.tipo_propriedade)}
            </div>
            <div style={{ display: 'flex', color: '#ffffff', fontSize: 39, lineHeight: 1.08, fontWeight: 900 }}>
              {displayTitle}
            </div>
            <div style={{ display: 'flex', color: '#e2e8f0', fontSize: 21, fontWeight: 600 }}>
              {location || 'Confira os detalhes desta oportunidade'}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginTop: 2,
                borderRadius: 18,
                padding: '16px 19px',
                background: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', color: '#475569', fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Lance a partir de
              </div>
              <div style={{ display: 'flex', color: '#101827', fontSize: 33, fontWeight: 900 }}>
                {formatCurrency(price)}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                borderRadius: 15,
                padding: '14px 18px',
                background: '#f97316',
                color: '#ffffff',
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: 1.5,
              }}
            >
              VEJA NO SITE  ↗
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', color: '#cbd5e1', fontSize: 15, fontWeight: 700 }}>
              nexoleiloes.com.br
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 675,
      headers: {
        'Cache-Control': 'private, no-store',
        ...(download ? { 'Content-Disposition': `attachment; filename="${filename}"` } : {}),
      },
    },
  );
}
