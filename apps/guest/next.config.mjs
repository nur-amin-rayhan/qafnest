import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'auth-providers.js': path.resolve(__dirname, 'src/components/providers/auth-providers.ts'),
      'auth-providers': path.resolve(__dirname, 'src/components/providers/auth-providers.ts'),
      '@/components/providers/auth-providers.js': path.resolve(__dirname, 'src/components/providers/auth-providers.ts'),
      '@/providers/auth-providers.js': path.resolve(__dirname, 'src/providers/auth-providers.ts'),
      '@/lib/auth-providers.js': path.resolve(__dirname, 'src/lib/auth-providers.ts'),
    };
    return config;
  },
  async rewrites() {
    const adminOrigin =
      process.env.ADMIN_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_ADMIN_INTERNAL_URL ||
      "http://127.0.0.1:3003";
    const cmsOrigin =
      process.env.CMS_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_CMS_INTERNAL_URL ||
      "http://127.0.0.1:3002";

    return {
      beforeFiles: [
        { source: '/admin', destination: `${adminOrigin}/admin` },
        { source: '/admin/:path*', destination: `${adminOrigin}/admin/:path*` },
        { source: '/cms', destination: `${cmsOrigin}/cms` },
        { source: '/cms/:path*', destination: `${cmsOrigin}/cms/:path*` },
      ],
      afterFiles: [
        { source: '/apartments', destination: '/search?type=villa' },
        { source: '/chalets', destination: '/search?type=chalet' },
        { source: '/farms', destination: '/search?type=farm' },
        { source: '/camps', destination: '/search?type=camp' },
        { source: '/en/apartments', destination: '/search?type=villa' },
        { source: '/en/chalets', destination: '/search?type=chalet' },
        { source: '/en/farms', destination: '/search?type=farm' },
        { source: '/en/camps', destination: '/search?type=camp' },
        { source: '/en/blog', destination: '/blog' },
      ],
    };
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default nextConfig;
