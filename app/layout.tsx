import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import {
  getAbsoluteUrl,
  getSeoImageUrl,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
} from '@/lib/site';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: `${SITE_NAME} | Imoveis em leilao com analise especializada`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
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
    url: getAbsoluteUrl('/'),
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Imoveis em leilao com analise especializada`,
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
    title: `${SITE_NAME} | Imoveis em leilao com analise especializada`,
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
