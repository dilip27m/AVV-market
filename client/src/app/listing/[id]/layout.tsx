import { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Rich previews when a listing link is shared on WhatsApp / Instagram
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    // Always fresh, so edited prices show up immediately in tab titles and share previews
    const res = await fetch(`${API_URL}/listings/${id}`, { cache: 'no-store' });
    if (!res.ok) return { title: 'Listing not found' };

    const listing = (await res.json()).data;
    const price = listing.price > 0 ? `₹${listing.price.toLocaleString('en-IN')}` : 'FREE';
    const title = `${listing.title} · ${price}`;
    const description =
      (listing.description || '').slice(0, 160) || `${listing.condition} · ${listing.category}. Pick up on campus.`;
    const images = listing.images?.[0] ? [{ url: listing.images[0] }] : undefined;

    return {
      title,
      description,
      openGraph: { title, description, images, type: 'website' },
      twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images: images?.map((i) => i.url) },
    };
  } catch {
    return {};
  }
}

export default function ListingLayout({ children }: Props) {
  return <>{children}</>;
}
