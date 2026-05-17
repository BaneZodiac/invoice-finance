import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [totalRevenue, outstanding, totalExpenses, recentInvoices, clientsCount, monthlyInvoices, monthlyExpenses] =
      await Promise.all([
        prisma.invoice.aggregate({ where: { status: "paid" }, _sum: { total: true } }),
        prisma.invoice.aggregate({ where: { status: { in: ["sent", "overdue"] } }, _sum: { total: true } }),
        prisma.expense.aggregate({ _sum: { amount: true } }),
        prisma.invoice.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { client: { select: { name: true } } },
        }),
        prisma.client.count(),
        prisma.invoice.findMany({
          where: { paidAt: { gte: twelveMonthsAgo } },
          select: { total: true, paidAt: true },
        }),
        prisma.expense.findMany({
          where: { date: { gte: twelveMonthsAgo } },
          select: { amount: true, date: true },
        }),
      ]);

    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthStr = d.toLocaleString("en-US", { month: "short", year: "2-digit" });

      const rev = monthlyInvoices
        .filter((inv) => inv.paidAt && inv.paidAt >= d && inv.paidAt <= monthEnd)
        .reduce((sum, inv) => sum + inv.total, 0);

      const exp = monthlyExpenses
        .filter((e) => e.date >= d && e.date <= monthEnd)
        .reduce((sum, e) => sum + e.amount, 0);

      return { month: monthStr, revenue: rev, expenses: exp };
    });

    const revenue = totalRevenue._sum.total || 0;
    const expenses = totalExpenses._sum.amount || 0;

    return Response.json({
      totalRevenue: revenue,
      outstanding: outstanding._sum.total || 0,
      totalExpenses: expenses,
      netProfit: revenue - expenses,
      clientsCount,
      recentInvoices: recentInvoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        issueDate: inv.issueDate,
        total: inv.total,
        status: inv.status,
        client: inv.client,
      })),
      monthlyRevenue,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Failed to fetch dashboard data", detail: msg }, { status: 500 });
  }
}
