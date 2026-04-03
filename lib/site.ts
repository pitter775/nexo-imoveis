export const SITE_NAME = 'Nexo Leiloes';
export const SITE_DESCRIPTION =
  'Marketplace de imoveis em leilao com curadoria, analise juridica e oportunidades publicas.';
export const SITE_OG_IMAGE_PATH = '/images/analise-imovel.png';

function normalizeSiteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

export function getSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.APP_URL ??
    process.env.VERCEL_URL ??
    'http://localhost:3000';

  return new URL(normalizeSiteUrl(rawUrl));
}

export function getAbsoluteUrl(path = '/') {
  return new URL(path, getSiteUrl()).toString();
}

export function getSeoImageUrl(path = SITE_OG_IMAGE_PATH) {
  return getAbsoluteUrl(path);
}
