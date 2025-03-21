/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'basescan.org',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'assets-cdn.trustwallet.com',
        port: ''
      }
    ]
  }
};

module.exports = nextConfig;
