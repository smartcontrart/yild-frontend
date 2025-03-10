import '@/styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
import { Providers } from '@/components/global/providers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import Image from 'next/image';
import Head from "next/head";
import { Cog } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Yild Finance</title>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <meta name="description" content="Yild Finance is an advanced DeFi platform that automates Uniswap V3 liquidity provision, optimizing yield strategies for effortless passive income. Maximize your earnings with automated LP management." />
        <meta property="og:image" content="/y.png" />
      </Head>
      <Providers>
        <div className={`min-h-screen bg-background ${inter.className}`}>
          <header className="border-b">
            <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className='flex flex-row gap-2'>
                <Link href="/" className="hover:cursor-pointer">
                  <Image src={"/yild.png"} alt='' width={100} height={100} className='p-2' />
                </Link>
                <Link href="/settings" className="hover:cursor-pointer self-center shadow-[0px_6px_12px_rgba(0,0,0,0.1)] p-2 rounded-md">
                  <Cog />
                </Link>
              </div>
              <ConnectButton label='Sign In' accountStatus={{
                smallScreen: "avatar",
                largeScreen: "full",
              }} />
            </nav>
          </header>
          <main className="container mx-auto px-4 py-8">
            <Component {...pageProps} />
          </main>
        </div>
      </Providers>
    </>
  );
}