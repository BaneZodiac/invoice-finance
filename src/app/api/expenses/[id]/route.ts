import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { company: { select: { id: true, name: true } } },
    });
    if (!expense) {
      return Response.json({ error: "Expense not found" }, { status: 404 });
    }
    return Response.json(expense);
  } catch (error) {
    return Response.json({ error: "Failed to fetch expense" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        description: body.description,
        category: body.category,
        amount: body.amount,
        taxAmount: body.taxAmount,
        date: body.date ? new Date(body.date) : undefined,
        receiptUrl: body.receiptUrl,
        notes: body.notes,
        companyId: body.companyId,
      },
      include: { company: { select: { id: true, name: true } } },
    });
    return Response.json(expense);
  } catch (error) {
    return Response.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.expense.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
