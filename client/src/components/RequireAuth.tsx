'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirectToLogin } from '@/lib/api';

/**
 * Wrap pages that need a logged-in user. Sends logged-out visitors
 * to /login and brings them back here afterwards.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) redirectToLogin();
  }, [isLoading, user]);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-4 border-border-subtle border-t-brand-primary animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
