import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lets several dev servers run side by side (NEXT_DIST_DIR=.next-a next dev -p 3301)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ["lucide-react"]
};

export default nextConfig;
