/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
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
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'cdn.gathern.co' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
  },
};

export default nextConfig;
