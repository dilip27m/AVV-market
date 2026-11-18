import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Saved items',
  description: 'Items you saved to buy later.',
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
