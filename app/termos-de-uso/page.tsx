import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/legal-document-page';
import { termsOfUse } from '@/lib/legal-content';
import { getPublicAbsoluteUrl, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description:
    'Termos de Uso da Nexo Leilões, com regras, direitos, deveres e responsabilidades sobre a utilização da plataforma.',
  alternates: {
    canonical: getPublicAbsoluteUrl('/termos-de-uso'),
  },
  openGraph: {
    type: 'article',
    url: getPublicAbsoluteUrl('/termos-de-uso'),
    siteName: SITE_NAME,
    title: `Termos de Uso | ${SITE_NAME}`,
  },
};

export default function TermosDeUsoPage() {
  return <LegalDocumentPage document={termsOfUse} />;
}
