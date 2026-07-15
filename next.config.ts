import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/admin/ai/:path*',
        destination: 'http://localhost:3000/admin/ai/:path*',
      },
    ];
  },
};

export default nextConfig;
