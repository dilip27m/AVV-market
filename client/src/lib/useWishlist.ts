'use client';

import useSWR from 'swr';
import toast from 'react-hot-toast';
import { api, getErrorMessage, redirectToLogin } from './api';
import { useAuth } from '@/context/AuthContext';

const fetcher = (url: string) => api.get(url).then((res) => res.data.data as { _id: string }[]);

/**
 * Shared wishlist state. SWR de-duplicates the request, so every card
 * on the page can call this without extra network traffic.
 */
export function useWishlist() {
  const { user } = useAuth();
  const { data, mutate } = useSWR(user ? '/users/me/wishlist' : null, fetcher);
  const ids = new Set((data || []).map((item) => item._id));

  const toggle = async (listingId: string) => {
    if (!user) {
      toast('Log in to save items', { icon: '🔒' });
      redirectToLogin();
      return;
    }

    const wasSaved = ids.has(listingId);
    // Optimistic update
    mutate(
      (prev = []) => (wasSaved ? prev.filter((i) => i._id !== listingId) : [...prev, { _id: listingId }]),
      false
    );

    try {
      await api.post(`/users/wishlist/${listingId}`);
      toast.success(wasSaved ? 'Removed from saved' : 'Saved ❤️');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update saved items'));
    } finally {
      mutate();
    }
  };

  return { isSaved: (id: string) => ids.has(id), toggle };
}
