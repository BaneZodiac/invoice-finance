import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const config = {
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
};

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaLibSql(config),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
