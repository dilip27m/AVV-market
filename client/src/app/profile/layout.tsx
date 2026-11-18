import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your profile',
  description: 'Your listings, saved items and settings.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
