import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable turbopack for build as it has issues with Prisma 7
  experimental: {
    turbo: {},
  },
};

export default nextConfig;
