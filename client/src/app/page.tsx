import { Navbar } from '@/components/Navbar';
import { ListingCard } from '@/components/ListingCard';
import { HomeFilters } from '@/components/HomeFilters';

interface Listing {
  _id: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
  category: string;
  meetAddress: string;
  sellerId?: {
    name: string;
    averageRating: number;
  };
  sellerName: string;
}

export default async function Home({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  // Await the searchParams promise (Next.js 15 requirement)
  const resolvedParams = await searchParams;
  
  const category = (resolvedParams.category as string) || 'All';
  const search = (resolvedParams.search as string) || '';
  const sort = (resolvedParams.sort as string) || 'newest';

  // Build the API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const query = new URLSearchParams();
  if (category !== 'All') query.append('category', category);
  if (search) query.append('search', search);
  if (sort) query.append('sort', sort);

  let listings: Listing[] = [];
  let error = '';

  try {
    const res = await fetch(`${apiUrl}/listings?${query.toString()}`, {
      // Opt into dynamic fetching (no cache) since listings change frequently
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error('Failed to fetch listings');
    }

    const json = await res.json();
    listings = json.data?.listings || [];
  } catch (err) {
    console.error('Error fetching listings:', err);
    error = 'Failed to load listings. Please try again later.';
  }

  const formattedListings = listings.map(item => ({
    ...item,
    seller: {
      name: item.sellerId?.name || item.sellerName,
      rating: item.sellerId?.averageRating || 0,
    }
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col p-4 sm:p-8 md:p-12 max-w-7xl mx-auto w-full">
        
        {/* Client component containing search, category, and sorting logic */}
        <HomeFilters />

        {/* Listings Grid */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {category === 'All' ? 'Recently Listed' : category}
          </h2>
          <span className="text-sm text-text-muted">{formattedListings.length} results</span>
        </div>

        {error ? (
          <div className="py-20 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : formattedListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {formattedListings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-border-subtle rounded-2xl bg-bg-panel">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-1">No items found</h3>
            <p className="text-text-muted text-sm">
              We couldn't find any listings matching your search.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
