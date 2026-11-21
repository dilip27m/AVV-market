'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { Logo } from './Logo';
import { InstallAppButton } from './InstallAppButton';

const NAV_LINKS = [
  { href: '/', label: 'Browse' },
  { href: '/wanted', label: 'Wanted' },
  { href: '/saved', label: 'Saved' },
];

export function Avatar({ name, src, size = 32 }: { name: string; src?: string; size?: number }) {
  return src ? (
    <span className="relative block rounded-full overflow-hidden border border-border-subtle shrink-0" style={{ width: size, height: size }}>
      <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" />
    </span>
  ) : (
    <span
      className="rounded-full bg-brand-soft text-brand-primary flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  );
}

export function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => event.key === 'Escape' && setDropdownOpen(false);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border-subtle bg-bg-base/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-16 items-center px-4 md:px-6 gap-4 max-w-7xl mx-auto">
        <Logo />

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1 ml-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive(link.href) ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <InstallAppButton className="hidden md:inline-flex" />

          {isLoading ? (
            <span className="w-9 h-9 rounded-full skeleton" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="Account menu"
                aria-expanded={dropdownOpen}
                className="flex items-center rounded-full hover:ring-4 hover:ring-bg-hover transition-shadow"
              >
                <Avatar name={user.name} src={user.profileImage} size={36} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-bg-panel border border-border-subtle rounded-2xl py-2 z-50 animate-fade-up" style={{ boxShadow: 'var(--shadow-card-hover)' }}>
                  <div className="px-4 py-2 border-b border-border-subtle mb-1">
                    <p className="text-sm font-semibold text-text-primary truncate">{user.name}</p>
                    <p className="text-xs text-text-muted truncate">{user.email}</p>
                  </div>
                  {[
                    { href: '/profile', label: 'My listings & profile' },
                    { href: `/seller/${user._id}`, label: 'My storefront' },
                    { href: '/profile/edit', label: 'Settings' },
                    ...(user.isAdmin ? [{ href: '/admin', label: 'Admin dashboard' }] : []),
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                      onClick={() => setDropdownOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left block px-4 py-2 mt-1 border-t border-border-subtle text-sm text-danger hover:bg-bg-hover"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} className="btn-secondary text-sm px-4 py-2">
              Log in
            </Link>
          )}

          <Link href="/sell" className="btn-primary text-sm px-5 py-2.5 hidden md:inline-flex">
            <span aria-hidden="true">+</span> Sell
          </Link>
        </div>
      </div>
    </nav>
  );
}
