import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/massava',
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
