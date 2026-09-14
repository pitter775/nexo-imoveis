import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import {
  getAbsoluteUrl,
  getSeoImageUrl,
  getSiteUrl,
  SITE_ADDRESS,
  SITE_DESCRIPTION,
  SITE_EMAIL,
  SITE_NAME,
  SITE_PHONE,
  SITE_SAME_AS,
  SITE_WHATSAPP_URL,
} from '@/lib/site';

const inter = Inter({ subsets: ['latin'] });
const homeUrl = getAbsoluteUrl('/');
const organizationId = `${homeUrl}#organization`;
const websiteId = `${homeUrl}#website`;

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['Organization', 'LocalBusiness', 'RealEstateAgent'],
      '@id': organizationId,
      name: SITE_NAME,
      legalName: SITE_NAME,
      url: homeUrl,
      logo: getAbsoluteUrl('/icon.svg'),
      image: getSeoImageUrl(),
      description: SITE_DESCRIPTION,
      email: SITE_EMAIL,
      telephone: SITE_PHONE,
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: SITE_PHONE,
          contactType: 'customer service',
          areaServed: 'BR',
          availableLanguage: ['pt-BR'],
          url: SITE_WHATSAPP_URL,
        },
      ],
      address: {
        '@type': 'PostalAddress',
        streetAddress: SITE_ADDRESS.streetAddress,
        addressLocality: SITE_ADDRESS.addressLocality,
        addressRegion: SITE_ADDRESS.addressRegion,
        addressCountry: SITE_ADDRESS.addressCountry,
      },
      areaServed: [
        {
          '@type': 'AdministrativeArea',
          name: 'São Bernardo do Campo',
        },
        {
          '@type': 'AdministrativeArea',
          name: 'São Paulo',
        },
      ],
      sameAs: SITE_SAME_AS,
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      name: SITE_NAME,
      url: homeUrl,
      description: SITE_DESCRIPTION,
      inLanguage: 'pt-BR',
      publisher: {
        '@id': organizationId,
      },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: `${SITE_NAME} | Imóveis em leilão com análise especializada`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: homeUrl }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'real estate',
  keywords: [
    'Nexo Leilões',
    'leilão de imóveis',
    'imóveis em leilão',
    'leilões imobiliários',
    'imóveis retomados',
    'São Bernardo do Campo',
    'análise jurídica imobiliária',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: homeUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Imóveis em leilão com análise especializada`,
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
    title: `${SITE_NAME} | Imóveis em leilão com análise especializada`,
    description: SITE_DESCRIPTION,
    images: [getSeoImageUrl()],
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
