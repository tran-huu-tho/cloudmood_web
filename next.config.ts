import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/admin/ai/:path*',
        destination: `${backendUrl}/admin/ai/:path*`,
      },
    ];
  },
};

export default nextConfig;
