'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ICONS = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  wanted: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  lost: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  profile: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
};

const Icon = ({ d }: { d: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

/** Thumb-friendly navigation for phones, with a raised Sell button in the middle. */
export function BottomNav() {
  const pathname = usePathname();

  // Hide on focused flows where the bottom bar would get in the way
  if (pathname.startsWith('/login') || pathname.startsWith('/sell') || pathname.endsWith('/edit')) return null;

  const item = (href: string, label: string, d: string) => {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
          active ? 'text-brand-primary' : 'text-text-muted'
        }`}
        aria-current={active ? 'page' : undefined}
      >
        <Icon d={d} />
        {label}
      </Link>
    );
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border-subtle bg-bg-panel/90 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main"
    >
      <div className="flex h-16 items-stretch">
        {item('/', 'Home', ICONS.home)}
        {item('/wanted', 'Wanted', ICONS.wanted)}
        <div className="flex flex-1 items-start justify-center">
          <Link
            href="/sell"
            aria-label="Sell an item"
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary text-3xl font-light shadow-lg ring-4 ring-bg-base active:scale-95 transition-transform"
            style={{ color: 'var(--text-on-brand)' }}
          >
            +
          </Link>
        </div>
        {item('/lost-and-found', 'Lost', ICONS.lost)}
        {item('/profile', 'Me', ICONS.profile)}
      </div>
    </nav>
  );
}
