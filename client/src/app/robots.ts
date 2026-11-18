import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/brand';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Personal or admin pages have nothing useful for search engines
      disallow: ['/admin', '/profile', '/saved', '/sell', '/login', '/listing/*/edit'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
