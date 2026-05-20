import { prisma } from "@/lib/db";
import { calculateInvoice } from "@/lib/utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        company: true,
        items: true,
        transactions: {
          include: {
            debitAccount: true,
            creditAccount: true,
          },
          orderBy: { date: "desc" },
        },
      },
    });
    if (!invoice) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }
    return Response.json(invoice);
  } catch (error) {
    return Response.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { items, ...invoiceData } = body;

    const updateData: Record<string, unknown> = {};

    if (invoiceData.number !== undefined) updateData.number = invoiceData.number;
    if (invoiceData.status !== undefined) updateData.status = invoiceData.status;
    if (invoiceData.type !== undefined) updateData.type = invoiceData.type;
    if (invoiceData.issueDate) updateData.issueDate = new Date(invoiceData.issueDate);
    if (invoiceData.dueDate) updateData.dueDate = new Date(invoiceData.dueDate);
    if (invoiceData.paidAt) updateData.paidAt = new Date(invoiceData.paidAt);
    if (invoiceData.notes !== undefined) updateData.notes = invoiceData.notes;
    if (invoiceData.terms !== undefined) updateData.terms = invoiceData.terms;
    if (invoiceData.companyId !== undefined) updateData.companyId = invoiceData.companyId;
    if (invoiceData.clientId !== undefined) updateData.clientId = invoiceData.clientId;

    if (items !== undefined) {
      let subtotal = items.reduce((sum: number, item: { quantity: unknown; unitPrice: unknown; amount?: unknown }) => {
        return sum + (Number(item.amount) || (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0));
      }, 0);
      const calculated = calculateInvoice(subtotal, invoiceData.taxRate ?? 0, invoiceData.discount ?? 0, invoiceData.discountType || "percentage");
      updateData.subtotal = calculated.subtotal;
      updateData.taxRate = invoiceData.taxRate ?? 0;
      updateData.taxAmount = calculated.taxAmount;
      updateData.discount = invoiceData.discount ?? 0;
      updateData.discountType = invoiceData.discountType || "percentage";
      updateData.total = calculated.total;
      updateData.amountPaid = invoiceData.amountPaid ?? 0;
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        company: true,
        items: true,
      },
    });

    if (items) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await prisma.invoiceItem.createMany({
        data: items.map((item: { description: string; quantity: unknown; unitPrice: unknown }) => ({
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          amount: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
          invoiceId: id,
        })),
      });
    }

    const updated = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true, company: true, items: true },
    });

    return Response.json(updated);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return Response.json({ error: "Failed to update invoice", detail }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await prisma.invoice.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
