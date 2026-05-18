import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        company: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });
    return Response.json(expenses);
  } catch (error) {
    return Response.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.companyId) {
      const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
      if (company) body.companyId = company.id;
    }

    const expense = await prisma.expense.create({
      data: {
        description: body.description,
        category: body.category || "",
        amount: body.amount,
        taxAmount: body.taxAmount || 0,
        date: body.date ? new Date(body.date) : new Date(),
        receiptUrl: body.receiptUrl || "",
        notes: body.notes || "",
        companyId: body.companyId,
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    });
    return Response.json(expense, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
