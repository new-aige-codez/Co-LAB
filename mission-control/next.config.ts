import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: standalone output disabled due to better-sqlite3 native module compatibility
  // For production deployment, use `next start` directly
  // output: "standalone",

  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost",
    "http://127.0.0.1",
    "localhost",
    "127.0.0.1",
  ],
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
