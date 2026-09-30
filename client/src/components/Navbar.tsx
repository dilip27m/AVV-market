'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState, useRef, useEffect } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {user.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.profileImage} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-border-subtle" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-bg-panel border border-border-subtle rounded-xl shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-border-subtle mb-1">
                    <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                    <p className="text-xs text-text-muted truncate">{user.email}</p>
                  </div>
                  <Link href="/profile" className="block px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary" onClick={() => setDropdownOpen(false)}>
                    My Profile
                  </Link>
                  <Link href="/sell" className="block px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary sm:hidden" onClick={() => setDropdownOpen(false)}>
                    Sell Item
                  </Link>
                  <button 
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    className="w-full text-left block px-4 py-2 text-sm text-red-500 hover:bg-bg-hover"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-secondary text-sm">
              Log In
            </Link>
          )}

          <Link href="/sell" className="btn-primary text-sm hidden sm:flex">
            Sell Item
          </Link>
        </div>
      </div>
    </nav>
  );
}
