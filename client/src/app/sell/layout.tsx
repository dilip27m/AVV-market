import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell an item',
  description: 'List your item in about a minute.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
