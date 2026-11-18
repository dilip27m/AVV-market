import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// "Dilip's farewell sale" previews when a storefront link is shared in WhatsApp groups
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const res = await fetch(`${API_URL}/users/${id}`, { cache: 'no-store' });
    if (!res.ok) return { title: 'Seller not found' };

    const seller = (await res.json()).data;
    const firstName = String(seller.name || 'Student').split(' ')[0];
    const title = `${firstName}'s items for sale`;
    const description = `${seller.activeListings} item${seller.activeListings === 1 ? '' : 's'} for sale on campus${
      seller.meetAddress ? ` · meets at ${seller.meetAddress}` : ''
    }.`;

    return { title, description, openGraph: { title, description } };
  } catch {
    return {};
  }
}

export default function SellerLayout({ children }: Props) {
  return <>{children}</>;
}
