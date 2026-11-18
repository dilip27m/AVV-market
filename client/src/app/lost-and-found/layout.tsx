import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lost & Found',
  description: "Report lost items and check that what you buy isn't stolen.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
