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

  const cover = images[0]?.url;
  const location = [property.cidade, property.estado].filter(Boolean).join(' · ');
  const price =
    property.valor_segundo_leilao ??
    property.valor_primeiro_leilao ??
    property.valor_minimo ??
    property.valor_avaliacao;
  const filename = `nexo-imovel-${id}.png`;
  const download = request.nextUrl.searchParams.get('download') === '1';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', position: 'relative',
          backgroundColor: '#101827', color: 'white', fontFamily: 'Arial, sans-serif',
        }}
      >
        {cover ? (
          <img src={cover} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', background: 'linear-gradient(135deg, #25364b, #101827)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', background: 'linear-gradient(180deg, rgba(8,18,32,0.08) 16%, rgba(8,18,32,0.35) 39%, rgba(8,18,32,0.96) 76%)' }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'space-between', padding: 64 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 32, fontWeight: 800, letterSpacing: 1 }}>
              <div style={{ width: 54, height: 54, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f97316', fontSize: 36 }}>N</div>
              {SITE_NAME}
            </div>
            <div style={{ display: 'flex', borderRadius: 999, padding: '13px 22px', background: '#f97316', fontSize: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              {formatPropertyType(property.tipo_propriedade)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 900 }}>
            <div style={{ display: 'flex', fontSize: 19, fontWeight: 800, color: '#fdba74', textTransform: 'uppercase', letterSpacing: 3 }}>Uma oportunidade para você</div>
            <div style={{ display: 'flex', fontSize: 56, lineHeight: 1.08, fontWeight: 900, textShadow: '0 3px 18px rgba(0,0,0,.35)' }}>{property.titulo}</div>
            <div style={{ display: 'flex', fontSize: 25, color: '#e2e8f0' }}>{location || 'Confira os detalhes desta oportunidade'}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', color: '#cbd5e1', fontSize: 18, textTransform: 'uppercase', letterSpacing: 2 }}>Lance a partir de</div>
                <div style={{ display: 'flex', fontSize: 42, fontWeight: 900, color: '#ffffff' }}>{formatCurrency(price)}</div>
              </div>
              <div style={{ display: 'flex', border: '2px solid rgba(255,255,255,.8)', borderRadius: 18, padding: '17px 23px', fontSize: 20, fontWeight: 800 }}>SAIBA MAIS  ↗</div>
            </div>
            <div style={{ display: 'flex', marginTop: 8, fontSize: 17, color: '#cbd5e1' }}>nexoleiloes.com.br</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
      headers: {
        'Cache-Control': 'private, no-store',
        ...(download ? { 'Content-Disposition': `attachment; filename="${filename}"` } : {}),
      },
    },
  );
}
