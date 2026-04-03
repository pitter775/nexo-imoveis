import { cache } from 'react';
import type { Metadata } from 'next';
import { PublicMarketplace } from '@/app/page';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getAbsoluteUrl,
  getSeoImageUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
} from '@/lib/site';

type ImovelDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const getPropertySeoData = cache(async (id: string) => {
  const supabase = createAdminClient();

  const [{ data: imovel, error: imovelError }, { data: imagens, error: imagensError }] =
    await Promise.all([
      supabase
        .from('imoveis')
        .select(
          'id, titulo, descricao, cidade, estado, tipo_propriedade, valor_avaliacao, valor_minimo, data_primeiro_leilao, valor_primeiro_leilao, data_segundo_leilao, valor_segundo_leilao, data_leilao, status',
        )
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('imovel_imagens')
        .select('url, ordem')
        .eq('imovel_id', id)
        .order('ordem', { ascending: true })
        .limit(1),
    ]);

  if (imovelError || imagensError || !imovel) {
    return null;
  }

  return {
    id: imovel.id,
    title: imovel.titulo,
    description: imovel.descricao,
    location: [imovel.cidade, imovel.estado].filter(Boolean).join(' - '),
    type: imovel.tipo_propriedade ?? 'Imovel',
    imageUrl: imagens?.[0]?.url ?? getSeoImageUrl(),
    publicPrice:
      imovel.valor_segundo_leilao ??
      imovel.valor_primeiro_leilao ??
      imovel.valor_minimo ??
      imovel.valor_avaliacao,
    publicAuctionDate:
      imovel.data_segundo_leilao ??
      imovel.data_primeiro_leilao ??
      imovel.data_leilao,
    status: imovel.status ?? 'ativo',
  };
});

function formatCurrency(value: number | null | undefined) {
  if (value == null) {
    return null;
  }

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function buildPropertyDescription(property: NonNullable<Awaited<ReturnType<typeof getPropertySeoData>>>) {
  const parts = [
    property.type,
    property.location,
    formatCurrency(property.publicPrice),
  ].filter(Boolean);

  return property.description?.trim() || parts.join(' | ') || SITE_DESCRIPTION;
}

export async function generateMetadata({
  params,
}: ImovelDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertySeoData(id);

  if (!property) {
    return {
      title: 'Imovel nao encontrado',
      description: SITE_DESCRIPTION,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const locationLabel = property.location ? ` em ${property.location}` : '';
  const title = `${property.title}${locationLabel}`;
  const description = buildPropertyDescription(property);
  const url = getAbsoluteUrl(`/imoveis/${property.id}`);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      url,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [
        {
          url: property.imageUrl,
          alt: property.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [property.imageUrl],
    },
  };
}

export default async function ImovelDetailsPage({
  params,
}: ImovelDetailsPageProps) {
  const { id } = await params;
  const property = await getPropertySeoData(id);
  const propertyUrl = getAbsoluteUrl(`/imoveis/${id}`);
  const structuredData = property
    ? {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: property.title,
        description: buildPropertyDescription(property),
        url: propertyUrl,
        image: [property.imageUrl],
        category: property.type,
        offers: property.publicPrice
          ? {
              '@type': 'Offer',
              price: property.publicPrice,
              priceCurrency: 'BRL',
              availability: 'https://schema.org/InStock',
              url: propertyUrl,
            }
          : undefined,
      }
    : null;

  return (
    <>
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      ) : null}
      <PublicMarketplace initialView="details" initialPropertyId={id} />
    </>
  );
}
