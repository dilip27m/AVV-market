import Link from 'next/link';
import { LogoMark } from './Logo';
import { APP_NAME } from '@/lib/brand';

export function Footer() {
  return (
    <footer className="w-full border-t border-border-subtle mt-16 py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid gap-8 sm:grid-cols-[1fr_auto]">
        <div className="space-y-3 max-w-sm">
          <div className="flex items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <span className="font-[family-name:var(--font-display)] font-extrabold">{APP_NAME}</span>
          </div>
          <p className="text-sm text-text-muted">
            Seniors pass it on, juniors save money, and less ends up in the bin. Built by students, for the campus.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
          <Link href="/" className="text-text-secondary hover:text-text-primary">Browse</Link>
          <Link href="/safety" className="text-text-secondary hover:text-text-primary">Safety tips</Link>
          <Link href="/sell" className="text-text-secondary hover:text-text-primary">Sell an item</Link>
          <Link href="/privacy" className="text-text-secondary hover:text-text-primary">Privacy</Link>
          <Link href="/wanted" className="text-text-secondary hover:text-text-primary">Wanted board</Link>
          <Link href="/saved" className="text-text-secondary hover:text-text-primary">Saved items</Link>
        </div>
      </div>
      <p className="max-w-7xl mx-auto px-4 md:px-6 mt-8 text-xs text-text-muted">
        &copy; {new Date().getFullYear()} {APP_NAME}. Not affiliated with the college administration.
      </p>
    </footer>
  );
}
