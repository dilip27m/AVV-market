export function ListingCardSkeleton() {
  return (
    <div className="panel-card p-0 overflow-hidden flex flex-col h-full animate-pulse border-border-subtle/50">
      
      {/* Image Skeleton */}
      <div className="aspect-[4/3] w-full bg-bg-hover relative">
        <div className="absolute top-2 right-2 w-16 h-6 rounded-md bg-bg-panel"></div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <div className="h-5 bg-bg-hover rounded-md w-3/4 mb-4"></div>
        
        {/* Price */}
        <div className="h-7 bg-bg-hover rounded-md w-1/3 mb-4"></div>

        {/* Footer info */}
        <div className="mt-auto space-y-2 pt-3 border-t border-border-subtle">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-bg-hover"></div>
              <div className="w-16 h-3 bg-bg-hover rounded-sm"></div>
            </div>
            <div className="w-10 h-3 bg-bg-hover rounded-sm"></div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-bg-hover rounded-full"></div>
            <div className="w-24 h-3 bg-bg-hover rounded-sm"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
