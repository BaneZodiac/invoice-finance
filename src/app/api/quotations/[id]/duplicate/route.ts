import { prisma } from "@/lib/db";
import { calculateInvoice, generateQuotationNumber } from "@/lib/utils";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const original = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!original) {
      return Response.json({ error: "Quotation not found" }, { status: 404 });
    }

    const items = original.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const calculated = calculateInvoice(subtotal, original.taxRate, original.discount, original.discountType);

    const quotation = await prisma.quotation.create({
      data: {
        number: generateQuotationNumber(),
        status: "draft",
        issueDate: new Date(),
        validUntil: original.validUntil,
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

    return Response.json(quotation, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: "Failed to duplicate quotation", detail: message }, { status: 500 });
  }
}
