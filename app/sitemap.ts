import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPublicAbsoluteUrl } from '@/lib/site';

export const revalidate = 3600;

type SitemapProperty = {
  id: string;
  created_at: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: getPublicAbsoluteUrl('/'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: getPublicAbsoluteUrl('/imoveis'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('imoveis')
      .select('id, created_at')
      .or('status.is.null,status.eq.ativo')
      .order('created_at', { ascending: false });

    if (error) {
      return staticRoutes;
    }

    const propertyRoutes = ((data ?? []) as SitemapProperty[]).map((property) => ({
      url: getPublicAbsoluteUrl(`/imoveis/${property.id}`),
      lastModified: property.created_at ? new Date(property.created_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...propertyRoutes];
  } catch {
    return staticRoutes;
  }
}
