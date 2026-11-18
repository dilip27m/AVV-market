export function ListingCardSkeleton() {
  return (
    <div className="rounded-3xl border border-border-subtle bg-bg-panel overflow-hidden flex flex-col h-full" aria-hidden="true">
      <div className="aspect-[4/3] w-full skeleton rounded-none" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-6 w-1/3 skeleton" />
        <div className="h-4 w-full skeleton" />
        <div className="h-4 w-2/3 skeleton" />
        <div className="mt-2 h-3 w-1/2 skeleton" />
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
