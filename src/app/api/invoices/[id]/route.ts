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

    let subtotal = invoiceData.subtotal || 0;
    if (items && items.length > 0) {
      subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number; amount?: number }) => {
        return sum + (item.amount || (item.quantity || 1) * (item.unitPrice || 0));
      }, 0);
    }
    const calculated = calculateInvoice(subtotal, invoiceData.taxRate || 0, invoiceData.discount || 0);

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        number: invoiceData.number,
        status: invoiceData.status,
        type: invoiceData.type,
        issueDate: invoiceData.issueDate ? new Date(invoiceData.issueDate) : undefined,
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : undefined,
        paidAt: invoiceData.paidAt ? new Date(invoiceData.paidAt) : undefined,
        subtotal: calculated.subtotal,
        taxRate: invoiceData.taxRate || 0,
        taxAmount: calculated.taxAmount,
        discount: invoiceData.discount || 0,
        total: calculated.total,
        amountPaid: invoiceData.amountPaid || 0,
        notes: invoiceData.notes,
        terms: invoiceData.terms,
        companyId: invoiceData.companyId,
        clientId: invoiceData.clientId,
      },
      include: {
        client: true,
        company: true,
        items: true,
      },
    });

    if (items) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await prisma.invoiceItem.createMany({
        data: items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          amount: (item.quantity || 1) * (item.unitPrice || 0),
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
    return Response.json({ error: "Failed to update invoice" }, { status: 500 });
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
