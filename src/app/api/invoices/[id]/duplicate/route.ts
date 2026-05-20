import { prisma } from "@/lib/db";
import { calculateInvoice, generateInvoiceNumber } from "@/lib/utils";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const original = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!original) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    const items = original.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
    }));

    const subtotal = items.reduce((sum: number, item) => sum + item.amount, 0);
    const calculated = calculateInvoice(subtotal, original.taxRate, original.discount, original.discountType);

    const invoice = await prisma.invoice.create({
      data: {
        number: generateInvoiceNumber(),
        status: "draft",
        type: original.type,
        issueDate: new Date(),
        dueDate: original.dueDate,
        subtotal: calculated.subtotal,
        taxRate: original.taxRate,
        taxAmount: calculated.taxAmount,
        discount: original.discount,
        discountType: original.discountType,
        total: calculated.total,
        notes: original.notes,
        terms: original.terms,
        companyId: original.companyId,
        clientId: original.clientId,
        items: { create: items },
      },
      include: { client: true, items: true },
    });

    return Response.json(invoice, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: "Failed to duplicate invoice", detail: message }, { status: 500 });
  }
}
