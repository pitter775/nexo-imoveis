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
  const isPortrait = format === 'portrait';
  const isCompactSplit = format === 'square';
  const isSplit = format !== 'portrait';
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
          flexDirection: isSplit ? 'row' : 'column',
          backgroundColor: '#101827',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            width: isSplit ? (isCompactSplit ? '65%' : '57%') : '100%',
            height: isSplit ? '100%' : '60%',
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
              left: isSplit ? 34 : 48,
              bottom: isSplit ? 34 : 38,
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
            width: isSplit ? (isCompactSplit ? '35%' : '43%') : '100%',
            height: isSplit ? '100%' : '40%',
            padding: isSplit ? (isCompactSplit ? '32px 26px' : '30px 36px') : '22px 58px 24px',
            backgroundColor: '#101827',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: isCompactSplit ? 42 : 48,
                height: isCompactSplit ? 42 : 48,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f97316',
                color: '#ffffff',
                fontSize: isCompactSplit ? 28 : 32,
                fontWeight: 900,
              }}
            >
              N
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', color: '#ffffff', fontSize: isCompactSplit ? 19 : 25, fontWeight: 800 }}>{SITE_NAME}</div>
              <div style={{ display: 'flex', color: '#cbd5e1', fontSize: isCompactSplit ? 9 : 12, fontWeight: 700, letterSpacing: isCompactSplit ? 2 : 3 }}>LEILÕES IMOBILIÁRIOS</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: isPortrait ? 8 : 10 }}>
            <div style={{ display: 'flex', alignSelf: 'flex-start', borderRadius: 999, padding: '8px 15px', background: '#26384d', color: '#fdba74', fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              {formatPropertyType(property.tipo_propriedade)} · LEILÃO
            </div>
            <div style={{ display: 'flex', color: '#ffffff', fontSize: isPortrait ? 55 : isCompactSplit ? 32 : 35, lineHeight: 1.08, fontWeight: 900 }}>
              {displayTitle}
            </div>
            <div style={{ display: 'flex', color: '#e2e8f0', fontSize: isCompactSplit ? 17 : 20, fontWeight: 600 }}>
              {location || 'Confira os detalhes desta oportunidade'}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: isPortrait || isCompactSplit ? 'column' : 'row',
                alignItems: isPortrait || isCompactSplit ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                gap: isPortrait || isCompactSplit ? 3 : 0,
                borderRadius: isPortrait ? 0 : 18,
                marginTop: 3,
                padding: isPortrait ? '4px 0' : isCompactSplit ? '8px 0' : '13px 22px',
                background: isPortrait ? 'transparent' : '#ffffff',
              }}
            >
              <div style={{ display: 'flex', color: isPortrait ? '#cbd5e1' : '#475569', fontSize: isPortrait ? 17 : isCompactSplit ? 12 : 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Lance inicial
              </div>
              <div style={{ display: 'flex', color: isPortrait ? '#ffffff' : '#101827', fontSize: isPortrait ? 41 : isCompactSplit ? 25 : 34, fontWeight: 900 }}>
                {formatCurrency(price)}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignSelf: isPortrait ? 'flex-start' : 'stretch',
                justifyContent: 'center',
                borderRadius: 14,
                padding: isPortrait ? '12px 30px' : isCompactSplit ? '10px 6px' : '12px 18px',
                background: '#f97316',
                color: '#ffffff',
                fontSize: isCompactSplit ? 13 : 17,
                fontWeight: 900,
                letterSpacing: 1.5,
              }}
            >
              VEJA NO SITE  ↗
            </div>
            <div style={{ display: 'flex', justifyContent: isPortrait ? 'flex-start' : 'center', color: '#cbd5e1', fontSize: isCompactSplit ? 11 : 14, fontWeight: 700 }}>
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
