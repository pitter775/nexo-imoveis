export const SITE_NAME = 'Nexo Leilões';
export const SITE_DESCRIPTION =
  'Imóveis em leilão com curadoria, análise jurídica e oportunidades selecionadas em São Bernardo do Campo e região.';
export const SITE_OG_IMAGE_PATH = '/images/analise-imovel.png';
export const PUBLIC_SITE_URL = 'https://www.nexoleiloes.com.br';
export const SITE_EMAIL = 'contato@nexoleiloes.com.br';
export const SITE_PHONE = '+55 11 91675-1213';
export const SITE_WHATSAPP_URL = 'https://wa.me/5511916751213';
export const SITE_ADDRESS = {
  streetAddress: 'Praça Samuel Sabatini, 226 - Centro',
  addressLocality: 'São Bernardo do Campo',
  addressRegion: 'SP',
  addressCountry: 'BR',
};
export const SITE_SAME_AS = ['https://www.instagram.com/nexoleiloes/'];

function normalizeSiteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

function isValidSiteUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  return !['MY_APP_URL', 'YOUR_APP_URL', 'APP_URL'].includes(value.trim().toUpperCase());
}

export function getSiteUrl() {
  const rawUrl =
    [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.APP_URL,
      process.env.VERCEL_URL,
    ].find(isValidSiteUrl) ?? PUBLIC_SITE_URL;

  return new URL(normalizeSiteUrl(rawUrl));
}

export function getAbsoluteUrl(path = '/') {
  return new URL(path, getSiteUrl()).toString();
}

export function getPublicAbsoluteUrl(path = '/') {
  return new URL(path, PUBLIC_SITE_URL).toString();
}

export function getSeoImageUrl(path = SITE_OG_IMAGE_PATH) {
  return getPublicAbsoluteUrl(path);
}
