import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Providers } from "./providers";
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CampusMart | College Marketplace",
  description: "A private marketplace for your campus. Buy, sell, and report lost items.",
  openGraph: {
    title: "CampusMart | College Marketplace",
    description: "A private marketplace for your campus. Buy, sell, and report lost items.",
    url: "https://campusmart.vercel.app", // Adjust domain later
    siteName: "CampusMart",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusMart | College Marketplace",
    description: "A private marketplace for your campus. Buy, sell, and report lost items.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CampusMart",
  },
};

export const viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full flex flex-col bg-bg-base text-text-primary">
        <Providers>
          <Toaster 
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#1a1a1a', // Charcoal black
                color: '#ffffff',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
              },
            }}
          />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

