import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const companyId = url.searchParams.get("companyId");
    const accountId = url.searchParams.get("accountId");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    if (accountId) {
      where.OR = [
        { debitAccountId: accountId },
        { creditAccountId: accountId },
      ];
    }
    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      where.date = dateFilter;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          debitAccount: { select: { id: true, code: true, name: true } },
          creditAccount: { select: { id: true, code: true, name: true } },
          company: { select: { id: true, name: true } },
          invoice: { select: { id: true, number: true } },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return Response.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return Response.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
