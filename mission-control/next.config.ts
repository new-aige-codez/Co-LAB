import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker/serverless deployment
  output: "standalone",

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
