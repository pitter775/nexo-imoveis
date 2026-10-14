import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getImovelById, listImovelImages } from '@/lib/admin/imoveis';
import { SITE_NAME } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };
type ArtworkFormat = 'portrait' | 'square' | 'wide';

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
  const requestedFormat = request.nextUrl.searchParams.get('format');
  const format: ArtworkFormat = requestedFormat === 'square' || requestedFormat === 'wide'
    ? requestedFormat
    : 'portrait';
  const isWide = format === 'wide';
  const dimensions = format === 'portrait'
    ? { width: 1080, height: 1350 }
    : format === 'square'
      ? { width: 1080, height: 1080 }
      : { width: 1200, height: 675 };
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
          flexDirection: isWide ? 'row' : 'column',
          backgroundColor: '#101827',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            width: isWide ? '57%' : '100%',
            height: isWide ? '100%' : format === 'square' ? '44%' : '54%',
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
              background: 'linear-gradient(180deg, rgba(8,18,32,0.18), transparent 45%, rgba(8,18,32,0.58))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: isWide ? 34 : 48,
              bottom: isWide ? 34 : 38,
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
            width: isWide ? '43%' : '100%',
            height: isWide ? '100%' : format === 'square' ? '56%' : '46%',
            padding: isWide ? '30px 36px' : format === 'square' ? '24px 48px' : '28px 58px 30px',
            backgroundColor: '#101827',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f97316',
                color: '#ffffff',
                fontSize: 32,
                fontWeight: 900,
              }}
            >
              N
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', color: '#ffffff', fontSize: 25, fontWeight: 800 }}>{SITE_NAME}</div>
              <div style={{ display: 'flex', color: '#cbd5e1', fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>LEILÕES IMOBILIÁRIOS</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignSelf: 'flex-start', borderRadius: 999, padding: '8px 15px', background: '#26384d', color: '#fdba74', fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              {formatPropertyType(property.tipo_propriedade)} · LEILÃO
            </div>
            <div style={{ display: 'flex', color: '#ffffff', fontSize: isWide ? 35 : format === 'square' ? 43 : 49, lineHeight: 1.08, fontWeight: 900 }}>
              {displayTitle}
            </div>
            <div style={{ display: 'flex', color: '#e2e8f0', fontSize: 20, fontWeight: 600 }}>
              {location || 'Confira os detalhes desta oportunidade'}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 18,
                marginTop: 3,
                padding: '13px 22px',
                background: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', color: '#475569', fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Lance inicial
              </div>
              <div style={{ display: 'flex', color: '#101827', fontSize: 34, fontWeight: 900 }}>
                {formatCurrency(price)}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                borderRadius: 14,
                padding: '12px 18px',
                background: '#f97316',
                color: '#ffffff',
                fontSize: 17,
                fontWeight: 900,
                letterSpacing: 1.5,
              }}
            >
              VEJA NO SITE  ↗
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', color: '#cbd5e1', fontSize: 14, fontWeight: 700 }}>
              nexoleiloes.com.br
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...dimensions,
      headers: {
        'Cache-Control': 'private, no-store',
        ...(download ? { 'Content-Disposition': `attachment; filename="${filename}"` } : {}),
      },
    },
  );
}
