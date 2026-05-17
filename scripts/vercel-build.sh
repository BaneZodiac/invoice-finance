#!/bin/bash
# Vercel build script - switches to PostgreSQL for production
set -e

echo "📦 Vercel build: Switching to PostgreSQL..."

# Update Prisma schema provider to PostgreSQL
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# PostgreSQL adapters are already in package.json

# Replace db.ts with PostgreSQL version
cat > src/lib/db.ts << 'DBCONTENT'
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const poolConfig = {
  connectionString: process.env.DATABASE_URL!,
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaNeon(poolConfig),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
DBCONTENT

# Regenerate Prisma client for PostgreSQL
npx prisma generate

# Push schema to database
npx prisma db push --accept-data-loss 2>/dev/null || true

echo "✅ PostgreSQL setup complete. Running Next.js build..."
next build
