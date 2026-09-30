import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@electric-sql/pglite"],
  agentRules: false,
  images: { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
