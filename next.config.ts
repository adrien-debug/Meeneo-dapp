import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static exports for Vercel
  output: 'standalone',

  // Optimize for production
  compress: true,

  // Allow external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Webpack configuration for external dependencies
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Proxy simulation API to Railway backend
  async rewrites() {
    const simulationApi = process.env.SIMULATION_API_URL || 'https://hearst-connect-backend-production.up.railway.app';
    return [
      {
        source: '/api/simulation/:path*',
        destination: `${simulationApi}/api/:path*`,
      },
    ];
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
