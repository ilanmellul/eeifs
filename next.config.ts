import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jghnzzqueowvtyxtauak.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
    minimumCacheTTL: 60 * 60 * 24, // 24h — aligné sur l'expiry des signed URLs Supabase
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 640, 750, 1080],
    imageSizes: [48, 96, 128, 200, 256],
  },
};

export default nextConfig;
