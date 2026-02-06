import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1:3000", "localhost:3000"],
  turbopack: {}, // Silence Turbopack warning
  // Webpack configuration for Shopify packages
  webpack: (config) => {
    // Fix for Shopify API compatibility with Turbopack
    // Resolve issues with node built-ins
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
