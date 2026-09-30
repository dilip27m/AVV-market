import Link from 'next/link';
import Image from 'next/image';

interface ListingCardProps {
  listing: {
    _id: string;
    title: string;
    price: number;
    images: string[];
    condition: string;
    category: string;
    meetAddress: string;
    postedAt?: string; // Optional for now, assuming createdAt will be formatted
    seller: {
      name: string;
      rating: number;
    };
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  // Use the first image, or a placeholder if none exist
  const imageUrl = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : 'https://via.placeholder.com/400x300?text=No+Image';

  return (
    <Link href={`/listing/${listing._id}`} className="group block panel-card p-0 overflow-hidden hover:border-brand-primary/50 transition-all hover:shadow-md flex flex-col h-full">
      
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full bg-bg-hover overflow-hidden">
        <Image 
          src={imageUrl} 
          alt={listing.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 bg-bg-base/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-text-primary shadow-sm border border-border-subtle">
          {listing.condition}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="font-semibold text-text-primary line-clamp-1 group-hover:text-brand-primary transition-colors">
            {listing.title}
          </h3>
        </div>
        
        <p className="text-xl font-bold text-text-primary mb-3">
          ₹{listing.price.toLocaleString('en-IN')}
        </p>

        <div className="mt-auto space-y-2 pt-3 border-t border-border-subtle">
          <div className="flex justify-between items-center text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-[8px]">
                {listing.seller.name.charAt(0)}
              </span>
              <span className="truncate max-w-[80px]">{listing.seller.name}</span>
            </span>
            <span>⭐ {listing.seller.rating.toFixed(1)}</span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{listing.meetAddress}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
