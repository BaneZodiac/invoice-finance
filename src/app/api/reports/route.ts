import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const [invoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: { issueDate: { gte: startDate, lt: endDate } },
        select: { total: true, status: true, paidAt: true, issueDate: true },
      }),
      prisma.expense.findMany({
        where: { date: { gte: startDate, lt: endDate } },
        select: { amount: true, category: true, date: true },
      }),
    ]);

    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(year, i, 1);
      const monthEnd = new Date(year, i + 1, 0);
      const monthStr = d.toLocaleString("en-US", { month: "short" });

      const rev = invoices
        .filter((inv) => inv.status === "paid" && inv.paidAt && inv.paidAt >= d && inv.paidAt <= monthEnd)
        .reduce((sum, inv) => sum + inv.total, 0);

      const exp = expenses
        .filter((e) => e.date >= d && e.date <= monthEnd)
        .reduce((sum, e) => sum + e.amount, 0);

      return { month: monthStr, revenue: rev, expenses: exp, profit: rev - exp };
    });

    const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    const categoryMap: Record<string, number> = {};
    expenses.forEach((e) => { categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount; });

    const statusMap: Record<string, number> = {};
    invoices.forEach((i) => { statusMap[i.status] = (statusMap[i.status] || 0) + 1; });

    return Response.json({
      monthlyRevenue,
      incomeVsExpenses: monthlyRevenue.map((m) => ({ month: m.month, income: m.revenue, expenses: m.expenses })),
      categoryBreakdown: Object.entries(categoryMap).map(([name, value]) => ({ name, value })),
      statusBreakdown: Object.entries(statusMap).map(([name, value]) => ({ name, value })),
      totalRevenue,
      totalExpenses,
      totalProfit: totalRevenue - totalExpenses,
      invoiceCount: invoices.length,
      paidCount: invoices.filter((i) => i.status === "paid").length,
      overdueCount: invoices.filter((i) => i.status === "overdue").length,
    });
  } catch (error) {
    return Response.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
