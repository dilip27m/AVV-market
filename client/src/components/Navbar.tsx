import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-base/80 backdrop-blur-md">
      <div className="flex h-14 items-center px-4 md:px-6 justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          {/* A sleek minimal logo/icon placeholder */}
          <div className="h-6 w-6 rounded bg-brand-primary flex items-center justify-center text-white text-xs font-bold">
            CM
          </div>
          <span className="font-semibold text-lg tracking-tight">CampusMart</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/lost-and-found" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            Lost & Found
          </Link>
          <div className="h-4 w-[1px] bg-border-subtle mx-2" />
          <Link href="/login" className="btn-secondary text-sm">
            Log In
          </Link>
          <Link href="/sell" className="btn-primary text-sm hidden sm:flex">
            Sell Item
          </Link>
        </div>
      </div>
    </nav>
  );
}
