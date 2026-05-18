import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: { select: { invoices: true, quotations: true } },
        invoices: {
          orderBy: { createdAt: "desc" },
          select: { id: true, number: true, status: true, issueDate: true, total: true },
        },
      },
    });
    if (!client) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    const billed = await prisma.invoice.aggregate({
      where: { clientId: id, status: "paid" },
      _sum: { total: true },
    });
    const outstanding = await prisma.invoice.aggregate({
      where: { clientId: id, status: { in: ["sent", "overdue"] } },
      _sum: { total: true },
    });

    return Response.json({
      ...client,
      totalBilled: billed._sum.total || 0,
      totalOutstanding: outstanding._sum.total || 0,
    });
  } catch (error) {
    return Response.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const client = await prisma.client.update({
      where: { id },
      data: body,
    });
    return Response.json(client);
  } catch (error) {
    return Response.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.client.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
