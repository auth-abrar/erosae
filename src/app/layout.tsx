import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { StoreProvider } from '@/context/StoreContext';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { CartDrawer } from '@/components/storefront/CartDrawer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Erosae — Multi-Category General Marketplace',
  description:
    'Erosae is a curated marketplace offering high quality electronics, fashion, home essentials, beauty products and lifestyle goods with regional shipping and trusted payments.',
  keywords: ['E-Commerce', 'Online Shopping', 'Marketplace', 'Erosae', 'Bangladesh', 'Middle East', 'Global'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-gray-50/50 text-gray-900 flex flex-col min-h-screen">
        <StoreProvider>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
          <CartDrawer />
        </StoreProvider>
      </body>
    </html>
  );
}
