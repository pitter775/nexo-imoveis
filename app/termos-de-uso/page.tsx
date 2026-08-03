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

export default async function TermosDeUsoPage({ searchParams }: LegalPageProps) {
  const params = await searchParams;

  return (
    <LegalDocumentPage
      document={termsOfUse}
      backHref={getSafeReturnPath(params?.returnTo)}
    />
  );
}
