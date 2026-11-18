import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/brand';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Rebuild the sitemap at most once an hour
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/wanted`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/safety`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  // Live listings and their sellers' storefronts. If the API is unreachable
  // (e.g. asleep during a build), still return the static pages.
  try {
    const res = await fetch(`${API_URL}/listings?limit=50`, { next: { revalidate: 3600 } });
    if (!res.ok) return staticPages;
    const { data } = await res.json();
    const listings: { _id: string; createdAt?: string; sellerId?: { _id: string } | string }[] = data?.listings || [];

    const sellerIds = new Set(
      listings.map((l) => (typeof l.sellerId === 'object' ? l.sellerId?._id : l.sellerId)).filter(Boolean) as string[]
    );

    return [
      ...staticPages,
      ...listings.map((l) => ({
        url: `${SITE_URL}/listing/${l._id}`,
        lastModified: l.createdAt ? new Date(l.createdAt) : now,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      })),
      ...[...sellerIds].map((id) => ({
        url: `${SITE_URL}/seller/${id}`,
        changeFrequency: 'daily' as const,
        priority: 0.5,
      })),
    ];
  } catch {
    return staticPages;
  }
}
