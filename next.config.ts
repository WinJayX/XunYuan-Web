import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',  // Use standalone for production deployment
  // Images are now optimized by Next.js server

  // Proxy API requests to backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:3000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
