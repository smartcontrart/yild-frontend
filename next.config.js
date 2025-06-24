/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Temporarily disable Terser to test if it's the cause
    if (!isServer) {
      config.optimization.minimize = false;
    }

    // Exclude HeartbeatWorker from webpack processing entirely
    if (!isServer) {
      // Add a rule to exclude HeartbeatWorker from all processing
      config.module.rules.push({
        test: /HeartbeatWorker/,
        use: "ignore-loader",
      });

      // Also try to exclude from Terser
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === "TerserPlugin") {
          const originalTest = minimizer.options.test;
          minimizer.options.test = (file) => {
            if (file.includes("HeartbeatWorker")) {
              return false;
            }
            return originalTest
              ? originalTest(file)
              : /\.m?js(\?.*)?$/i.test(file);
          };
        }
      });
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "basescan.org",
        port: "",
      },
      {
        protocol: "https",
        hostname: "assets-cdn.trustwallet.com",
        port: "",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: "https://api.yild.finance/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
