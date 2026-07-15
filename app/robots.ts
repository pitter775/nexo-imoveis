import type { MetadataRoute } from 'next';
import { getPublicAbsoluteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/imoveis', '/imoveis/'],
        disallow: ['/admin/', '/api/', '/dashboard/', '/login', '/teste', '/upload'],
      },
    ],
    sitemap: getPublicAbsoluteUrl('/sitemap.xml'),
    host: getPublicAbsoluteUrl('/').replace(/\/$/, ''),
  };
}
