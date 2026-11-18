import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wanted board',
  description: "Post what you're looking for and let sellers reach you.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
