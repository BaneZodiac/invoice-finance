import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-libsql"],
};

export default nextConfig;
