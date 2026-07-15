import type { Metadata } from 'next';
import { PublicMarketplace } from '@/app/page';
import { getPublicAbsoluteUrl, getSeoImageUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `Imoveis em leilao | ${SITE_NAME}`,
  description:
    'Encontre imoveis em leilao analisados pela Nexo, com oportunidades selecionadas e informacoes para tomada de decisao.',
  alternates: {
    canonical: getPublicAbsoluteUrl('/imoveis'),
  },
  openGraph: {
    type: 'website',
    url: getPublicAbsoluteUrl('/imoveis'),
    siteName: SITE_NAME,
    title: `Imoveis em leilao | ${SITE_NAME}`,
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
    title: `Imoveis em leilao | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    images: [getSeoImageUrl()],
  },
};

export default function ImoveisPage() {
  return <PublicMarketplace initialView="listings" />;
}
