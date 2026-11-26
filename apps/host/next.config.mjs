import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applySharedWebpackConfig,
  getAllowedImageRemotePatterns,
  getGlobalSecurityHeaders,
} from "../../packages/shared/nextConfigSecurity.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  transpilePackages: ["@qafnest/shared"],
  experimental: {
    optimizePackageImports: ["lucide-react", "@supabase/supabase-js"],
  },
  webpack: (config) => {
    return applySharedWebpackConfig(config, path.resolve(__dirname, "../../packages/shared"));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getGlobalSecurityHeaders(),
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: getAllowedImageRemotePatterns(),
  },
};

export default nextConfig;
