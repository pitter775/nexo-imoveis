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

function formatAuctionDate(value: string | null | undefined) {
  if (!value) return 'Data a confirmar';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data a confirmar';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
  const isSquare = format === 'square';
  const isWide = format === 'wide';
  const isSplit = isWide;
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
  const firstBid = property.valor_primeiro_leilao ?? null;
  const secondBid = property.valor_segundo_leilao ?? null;
  const discount = firstBid && secondBid && firstBid > secondBid
    ? Math.round((1 - secondBid / firstBid) * 100)
    : null;
  const facts = [
    property.quartos ? `${property.quartos} ${property.quartos === 1 ? 'quarto' : 'quartos'}` : null,
    property.banheiros ? `${property.banheiros} ${property.banheiros === 1 ? 'banheiro' : 'banheiros'}` : null,
    property.area_total ? `${property.area_total} m²` : null,
  ].filter(Boolean);

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
            width: isSplit ? '57%' : '100%',
            height: isSplit ? '100%' : isSquare ? '50%' : '36%',
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
          {isSquare || isPortrait ? (
            <div style={{ position: 'absolute', top: 32, left: 38, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderRadius: 18, background: 'rgba(16,24,39,0.78)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f97316', color: '#ffffff', fontSize: 32, fontWeight: 900 }}>N</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', color: '#ffffff', fontSize: 25, fontWeight: 800 }}>{SITE_NAME}</div>
                <div style={{ display: 'flex', color: '#cbd5e1', fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>LEILÕES IMOBILIÁRIOS</div>
              </div>
            </div>
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
              bottom: isPortrait ? 24 : isSplit ? 34 : 38,
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
            width: isSplit ? '43%' : '100%',
            height: isSplit ? '100%' : isSquare ? '50%' : '64%',
            padding: isSplit ? '30px 36px' : isSquare ? '28px 48px 30px' : '26px 44px 28px',
            backgroundColor: '#101827',
          }}
        >
          {isPortrait ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', color: '#fb923c', fontSize: 22, fontWeight: 900, letterSpacing: 3 }}>OPORTUNIDADE EM LEILÃO</div>
                <div style={{ display: 'flex', color: '#ffffff', fontSize: 46, lineHeight: 1.04, fontWeight: 900 }}>{displayTitle}</div>
                <div style={{ display: 'flex', color: '#cbd5e1', fontSize: 25, fontWeight: 700 }}>{location || 'Confira os detalhes desta oportunidade'}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '17px 22px', borderRadius: 18, background: '#f8fafc', color: '#101827' }}>
                <div style={{ display: 'flex', color: '#0f766e', fontSize: 19, fontWeight: 900, letterSpacing: 2 }}>SOBRE O IMÓVEL</div>
                <div style={{ display: 'flex', fontSize: 24, fontWeight: 800 }}>{formatPropertyType(property.tipo_propriedade)}{property.tipo_leilao ? ` · ${property.tipo_leilao}` : ''}</div>
                {property.rua ? <div style={{ display: 'flex', color: '#334155', fontSize: 19 }}>{[property.rua, property.numero, property.complemento].filter(Boolean).join(', ')}</div> : null}
                {facts.length ? <div style={{ display: 'flex', color: '#0f766e', fontSize: 21, fontWeight: 800 }}>{facts.join('   ·   ')}</div> : null}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', color: '#ffffff', fontSize: 23, fontWeight: 900, letterSpacing: 2 }}>DATAS E LANCES</div>
                  {discount ? <div style={{ display: 'flex', borderRadius: 999, padding: '7px 15px', background: '#0f766e', color: '#ffffff', fontSize: 18, fontWeight: 900 }}>ATÉ {discount}% DE DESCONTO</div> : null}
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  {[{ label: '1ª PRAÇA', date: formatAuctionDate(property.data_primeiro_leilao), bid: firstBid, color: '#0f766e' }, { label: '2ª PRAÇA', date: formatAuctionDate(property.data_segundo_leilao), bid: secondBid, color: '#c2410c' }].map((auction) => (
                    <div key={auction.label} style={{ display: 'flex', flexDirection: 'column', flex: 1, borderRadius: 16, overflow: 'hidden', background: '#f8fafc', color: '#101827' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '13px 16px', background: auction.color, color: '#ffffff' }}>
                        <div style={{ display: 'flex', fontSize: 21, fontWeight: 900 }}>{auction.label}</div>
                        <div style={{ display: 'flex', fontSize: 17, fontWeight: 700 }}>{auction.date}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 16px' }}>
                        <div style={{ display: 'flex', color: '#475569', fontSize: 15, fontWeight: 800 }}>LANCE MÍNIMO</div>
                        <div style={{ display: 'flex', color: auction.color, fontSize: 27, fontWeight: 900 }}>{formatCurrency(auction.bid)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', borderRadius: 14, padding: '14px 20px', background: '#f97316', color: '#ffffff', fontSize: 21, fontWeight: 900, letterSpacing: 1.5 }}>VEJA TODOS OS DETALHES NO SITE ↗</div>
              <div style={{ display: 'flex', justifyContent: 'center', color: '#cbd5e1', fontSize: 16, fontWeight: 700 }}>nexoleiloes.com.br · As informações podem ser atualizadas. Consulte o edital.</div>
            </div>
          ) : <>
          {!isSquare ? <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
          </div> : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: isPortrait ? 8 : 10 }}>
            <div style={{ display: 'flex', alignSelf: 'flex-start', borderRadius: 999, padding: isPortrait ? '10px 18px' : '8px 15px', background: '#26384d', color: '#fdba74', fontSize: isPortrait ? 19 : 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              {formatPropertyType(property.tipo_propriedade)} · LEILÃO
            </div>
            <div style={{ display: 'flex', color: '#ffffff', fontSize: isPortrait ? 59 : isSquare ? 43 : 35, lineHeight: 1.08, fontWeight: 900 }}>
              {displayTitle}
            </div>
            <div style={{ display: 'flex', color: '#e2e8f0', fontSize: isPortrait ? 24 : 20, fontWeight: 600 }}>
              {location || 'Confira os detalhes desta oportunidade'}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: isPortrait ? 'column' : 'row',
                alignItems: isPortrait ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                gap: isPortrait ? 3 : 0,
                borderRadius: isPortrait ? 0 : 18,
                marginTop: 3,
                padding: isPortrait ? '4px 0' : '13px 22px',
                background: isPortrait ? 'transparent' : '#ffffff',
              }}
            >
              <div style={{ display: 'flex', color: isPortrait ? '#cbd5e1' : '#475569', fontSize: isPortrait ? 20 : 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Lance inicial
              </div>
              <div style={{ display: 'flex', color: isPortrait ? '#ffffff' : '#101827', fontSize: isPortrait ? 46 : 34, fontWeight: 900 }}>
                {formatCurrency(price)}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignSelf: isPortrait ? 'flex-start' : 'stretch',
                justifyContent: 'center',
                borderRadius: 14,
                padding: isPortrait ? '12px 30px' : '12px 18px',
                background: '#f97316',
                color: '#ffffff',
                fontSize: isPortrait ? 20 : 17,
                fontWeight: 900,
                letterSpacing: 1.5,
              }}
            >
              VEJA NO SITE  ↗
            </div>
            <div style={{ display: 'flex', justifyContent: isPortrait ? 'flex-start' : 'center', color: '#cbd5e1', fontSize: isPortrait ? 17 : 14, fontWeight: 700 }}>
              nexoleiloes.com.br
            </div>
          </div>
          </>}
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
