import type { Metadata } from 'next';
import { PublicMarketplace } from '@/app/page';
import { getPublicAbsoluteUrl, getSeoImageUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `Imóveis em leilão | ${SITE_NAME}`,
  description:
    'Encontre imóveis em leilão analisados pela Nexo, com oportunidades selecionadas e informações para tomada de decisão.',
  alternates: {
    canonical: getPublicAbsoluteUrl('/imoveis'),
  },
  openGraph: {
    type: 'website',
    url: getPublicAbsoluteUrl('/imoveis'),
    siteName: SITE_NAME,
    title: `Imóveis em leilão | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: getSeoImageUrl(),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Imóveis em leilão | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    images: [getSeoImageUrl()],
  },
};

export default function ImoveisPage() {
  return <PublicMarketplace initialView="listings" />;
}
