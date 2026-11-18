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
  const imageUrl = listing.images?.[0];

  return (
    <Link href={`/listing/${listing._id}`} className="group block panel-card p-0 overflow-hidden hover:border-brand-primary/50 transition-all hover:shadow-md flex flex-col h-full">
      
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full bg-bg-hover overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">No photo</span>
          </div>
        )}
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
                {(listing.seller.name || '?').charAt(0)}
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
            <span className="truncate">{listing.meetAddress || 'On campus'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
