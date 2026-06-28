import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import BottomNav from "@/components/layout/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import dynamic from "next/dynamic";
import { ServiceWorkerCleanup } from "@/components/ServiceWorkerCleanup";
const LiveTicker = dynamic(() => import("@/components/features/LiveTicker").then(mod => mod.LiveTicker));
const CreditAnimation = dynamic(() => import("@/components/ui/CreditAnimation"));
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Recycle, Earn, & Shop Sustainably | EcoSort AI",
  description: "Transform your waste into rewards. Scan, recycle, and earn points toward exclusive eco-friendly products.",
  openGraph: {
    title: "EcoSort AI - Recycle, Earn, & Shop Sustainably",
    description: "Transform your waste into rewards. Scan, recycle, and earn points toward exclusive eco-friendly products. Join the circular economy today.",
    url: "https://ecosort.ai",
    siteName: "EcoSort AI",
    images: [
      {
        url: "https://placehold.co/1200x630/22c55e/white?text=EcoSort+AI",
        width: 1200,
        height: 630,
        alt: "EcoSort AI Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 antialiased transition-colors duration-300`} suppressHydrationWarning>
        <ServiceWorkerCleanup />
        <ThemeProvider>
          <Navigation />
          <main className="pt-16 pb-20 md:pb-0 min-h-screen relative z-0">
            {children}
          </main>
          <BottomNav />
          <LiveTicker />
          <CreditAnimation />
        </ThemeProvider>
      </body>
    </html>
  );
}
