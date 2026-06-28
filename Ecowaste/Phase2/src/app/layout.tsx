import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import '../styles/tailwind.css';
import CreditAnimation from '@/components/ui/CreditAnimation';
import AuthBridge from '@/components/AuthBridge';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'EcoSortAI — On-Demand Plastic Waste Collection',
  description:
    'EcoSortAI connects plastic waste generators with verified collectors for fast, trackable, on-demand pickup across your city.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className={plusJakartaSans.className}>
        <Suspense fallback={null}>
          <AuthBridge />
        </Suspense>
        {children}
        <Toaster position="bottom-right" richColors closeButton />
        <CreditAnimation />
      </body>
    </html>
  );
}