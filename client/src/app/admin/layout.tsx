import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Moderation',
  description: 'Review reported listings.',
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
