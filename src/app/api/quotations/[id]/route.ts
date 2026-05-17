import { prisma } from "@/lib/db";
import { calculateInvoice } from "@/lib/utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        client: true,
        company: true,
        items: true,
      },
    });
    if (!quotation) {
      return Response.json({ error: "Quotation not found" }, { status: 404 });
    }
    return Response.json(quotation);
  } catch (error) {
    return Response.json({ error: "Failed to fetch quotation" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { items, ...quotationData } = body;

    const calculated = calculateInvoice(
      quotationData.subtotal || 0,
      quotationData.taxRate || 0,
      quotationData.discount || 0
    );

    await prisma.quotation.update({
      where: { id },
      data: {
        number: quotationData.number,
        status: quotationData.status,
        issueDate: quotationData.issueDate ? new Date(quotationData.issueDate) : undefined,
        validUntil: quotationData.validUntil ? new Date(quotationData.validUntil) : undefined,
        subtotal: calculated.subtotal,
        taxRate: quotationData.taxRate || 0,
        taxAmount: calculated.taxAmount,
        discount: quotationData.discount || 0,
        total: calculated.total,
        notes: quotationData.notes,
        terms: quotationData.terms,
        companyId: quotationData.companyId,
        clientId: quotationData.clientId,
      },
    });

    if (items) {
      await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
      await prisma.quotationItem.createMany({
        data: items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          amount: (item.quantity || 1) * (item.unitPrice || 0),
          quotationId: id,
        })),
      });
    }

    const updated = await prisma.quotation.findUnique({
      where: { id },
      include: { client: true, company: true, items: true },
    });

    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: "Failed to update quotation" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
    await prisma.quotation.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete quotation" }, { status: 500 });
  }
}
