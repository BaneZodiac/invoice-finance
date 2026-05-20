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

    const updateData: Record<string, unknown> = {};

    if (quotationData.number !== undefined) updateData.number = quotationData.number;
    if (quotationData.status !== undefined) updateData.status = quotationData.status;
    if (quotationData.issueDate) updateData.issueDate = new Date(quotationData.issueDate);
    if (quotationData.validUntil) updateData.validUntil = new Date(quotationData.validUntil);
    else if (quotationData.dueDate) updateData.validUntil = new Date(quotationData.dueDate);
    if (quotationData.notes !== undefined) updateData.notes = quotationData.notes;
    if (quotationData.terms !== undefined) updateData.terms = quotationData.terms;
    if (quotationData.companyId !== undefined) updateData.companyId = quotationData.companyId;
    if (quotationData.clientId !== undefined) updateData.clientId = quotationData.clientId;

    if (items !== undefined) {
      let subtotal = items.reduce((sum: number, item: { quantity: unknown; unitPrice: unknown; amount?: unknown }) => {
        return sum + (Number(item.amount) || (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0));
      }, 0);
      const calculated = calculateInvoice(subtotal, quotationData.taxRate ?? 0, quotationData.discount ?? 0, quotationData.discountType || "percentage");
      updateData.subtotal = calculated.subtotal;
      updateData.taxRate = quotationData.taxRate ?? 0;
      updateData.taxAmount = calculated.taxAmount;
      updateData.discount = quotationData.discount ?? 0;
      updateData.discountType = quotationData.discountType || "percentage";
      updateData.total = calculated.total;
    }

    await prisma.quotation.update({
      where: { id },
      data: updateData,
    });

    if (items !== undefined) {
      await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
      await prisma.quotationItem.createMany({
        data: items.map((item: { description: string; quantity: unknown; unitPrice: unknown }) => ({
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          amount: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
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
