import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/legal-document-page';
import { privacyPolicy } from '@/lib/legal-content';
import { getPublicAbsoluteUrl, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Política de Privacidade da Nexo Leilões, com informações sobre coleta, uso, compartilhamento, segurança e direitos dos titulares.',
  alternates: {
    canonical: getPublicAbsoluteUrl('/politica-de-privacidade'),
  },
  openGraph: {
    type: 'article',
    url: getPublicAbsoluteUrl('/politica-de-privacidade'),
    siteName: SITE_NAME,
    title: `Política de Privacidade | ${SITE_NAME}`,
  },
};

export default function PoliticaDePrivacidadePage() {
  return <LegalDocumentPage document={privacyPolicy} />;
}
