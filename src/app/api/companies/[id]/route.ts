import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: { select: { invoices: true, quotations: true, expenses: true, transactions: true } },
      },
    });
    if (!company) {
      return Response.json({ error: "Company not found" }, { status: 404 });
    }
    return Response.json(company);
  } catch (error) {
    return Response.json({ error: "Failed to fetch company" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const company = await prisma.company.update({
      where: { id },
      data: body,
    });
    return Response.json(company);
  } catch (error) {
    return Response.json({ error: "Failed to update company" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.company.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete company" }, { status: 500 });
  }
}
