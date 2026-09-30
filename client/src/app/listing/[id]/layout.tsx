import { Metadata } from 'next';
import axios from 'axios';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    // We hit the backend directly to fetch the listing data for SEO
    // Using process.env.NEXT_PUBLIC_API_URL or fallback for SSR
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    const { data } = await axios.get(`${apiUrl}/listings/${resolvedParams.id}`);
    const listing = data.data;

    if (!listing) {
      return { title: 'Listing Not Found | CampusMart' };
    }

    const title = `${listing.title} - ₹${listing.price} | CampusMart`;
    const description = listing.description || `Buy ${listing.title} on CampusMart.`;
    const imageUrl = listing.images?.[0] || 'https://campusmart.vercel.app/og-image.png';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: imageUrl }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'CampusMart | College Marketplace',
    };
  }
}

export default function ListingLayout({ children }: Props) {
  return <>{children}</>;
}
