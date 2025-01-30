import '@/styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
import { Providers } from '@/components/providers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <div className={`min-h-screen bg-background ${inter.className}`}>
        <header className="border-b">
          <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="hover:cursor-pointer">
              <h1 className="text-xl font-bold">Yild Finance</h1>
            </Link>
            <ConnectButton />
          </nav>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Component {...pageProps} />
        </main>
      </div>
    </Providers>
  );
}