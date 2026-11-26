import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applySharedWebpackConfig,
  getAllowedImageRemotePatterns,
  getGlobalSecurityHeaders,
} from '../../packages/shared/nextConfigSecurity.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  transpilePackages: ['@qafnest/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js', 'framer-motion'],
    outputFileTracingExcludes: {
      '**': [
        '**/.next/cache/**',
        '**/.git/**',
        '../../apps/host/**',
        '../../apps/admin/**',
        '../../apps/cms/**',
        '../../.qafnest-*.json',
      ],
    },
  },
  webpack: (config) => {
    return applySharedWebpackConfig(config, path.resolve(__dirname, '../../packages/shared'));
  },
  async rewrites() {
    return [
      { source: '/apartments', destination: '/search?type=villa' },
      { source: '/chalets', destination: '/search?type=chalet' },
      { source: '/farms', destination: '/search?type=farm' },
      { source: '/camps', destination: '/search?type=camp' },
      { source: '/en/apartments', destination: '/search?type=villa' },
      { source: '/en/chalets', destination: '/search?type=chalet' },
      { source: '/en/farms', destination: '/search?type=farm' },
      { source: '/en/camps', destination: '/search?type=camp' },
      { source: '/en/blog', destination: '/blog' },
    ];
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const globalSecurity = getGlobalSecurityHeaders();
    const assetCacheHeader = {
      key: 'Cache-Control',
      value: isProd ? 'public, max-age=31536000, immutable' : 'no-store, must-revalidate',
    };
    return [
      {
        source: '/:path*',
        headers: globalSecurity,
      },
      {
        source: '/_next/static/:path*',
        headers: [...globalSecurity, assetCacheHeader],
      },
      {
        source: '/payment-icons/:path*',
        headers: [...globalSecurity, assetCacheHeader],
      },
      {
        source: '/apple-pay-mark.svg',
        headers: [...globalSecurity, assetCacheHeader],
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    remotePatterns: getAllowedImageRemotePatterns(),
  },
};

export default nextConfig;
