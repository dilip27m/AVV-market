import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/next';
import { APP_NAME, APP_DESCRIPTION, APP_TAGLINE, SITE_URL } from '@/lib/brand';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME} | ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  openGraph: {
    title: `${APP_NAME} | ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    url: '/',
    siteName: APP_NAME,
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} | ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: '#f6f6fa',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary pb-safe-nav">
        <Providers>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--bg-panel)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '12px 16px',
                fontSize: '14px',
                boxShadow: 'var(--shadow-card-hover)',
              },
            }}
          />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
          <BottomNav />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
