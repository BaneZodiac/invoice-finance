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
        include: { client: { select: { name: true } } },
        orderBy: { issueDate: "asc" },
      }),
      prisma.expense.findMany({
        where: { date: { gte: startDate, lt: endDate } },
        orderBy: { date: "asc" },
      }),
    ]);

    const rows = [
      "Type,Number,Client/Category,Date,Amount,Status",
      ...invoices.map((inv) =>
        `Invoice,${inv.number},"${inv.client?.name || ""}",${inv.issueDate.toISOString().split("T")[0]},${inv.total},${inv.status}`
      ),
      ...expenses.map((exp) =>
        `Expense,,${exp.category},${exp.date.toISOString().split("T")[0]},${exp.amount},`
      ),
    ];

    const csv = rows.join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="financial-report-${year}.csv"`,
      },
    });
  } catch (error) {
    return Response.json({ error: "Failed to export report" }, { status: 500 });
  }
}
