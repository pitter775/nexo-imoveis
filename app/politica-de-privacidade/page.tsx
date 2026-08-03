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

type LegalPageProps = {
  searchParams?: Promise<{
    returnTo?: string | string[];
  }>;
};

function getSafeReturnPath(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate?.startsWith('/') || candidate.startsWith('//')) {
    return '/';
  }

  return candidate;
}

export default async function PoliticaDePrivacidadePage({ searchParams }: LegalPageProps) {
  const params = await searchParams;

  return (
    <LegalDocumentPage
      document={privacyPolicy}
      backHref={getSafeReturnPath(params?.returnTo)}
    />
  );
}
