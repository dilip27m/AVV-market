import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Sign in with Google to buy and sell on campus.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
