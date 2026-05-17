#!/bin/bash
# Nomads Finance - Deployment Prep Script
# Run this BEFORE deploying to Vercel/Railway with PostgreSQL
#
# Usage: bash scripts/deploy.sh

set -e

echo "🔧 Switching database from SQLite to PostgreSQL..."

# 1. Update Prisma schema provider
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# 2. Install PostgreSQL adapter
npm install @prisma/adapter-neon @neondatabase/serverless

# 3. Update db.ts to use Neon adapter
cat > src/lib/db.ts << 'EOF'
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaNeon(new Pool({ connectionString: process.env.DATABASE_URL })),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
EOF

# 4. Regenerate Prisma client
npx prisma generate

# 5. Create initial migration
npx prisma db push

echo "✅ Done! Your app is ready for PostgreSQL deployment."
echo ""
echo "Set your DATABASE_URL environment variable on Vercel to:"
echo "  postgresql://user:password@host:5432/db?schema=public"
echo ""
echo "Then deploy normally."
