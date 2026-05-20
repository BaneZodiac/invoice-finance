import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-libsql"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
