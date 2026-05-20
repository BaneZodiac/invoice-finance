import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!quotation) {
      return Response.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (quotation.convertedToInvoiceId) {
      return Response.json({ error: "Quotation already converted to invoice" }, { status: 400 });
    }

    const invoice = await prisma.invoice.create({
      data: {
        number: generateInvoiceNumber(),
        status: "draft",
        type: "invoice",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: quotation.subtotal,
        taxRate: quotation.taxRate,
        taxAmount: quotation.taxAmount,
        discount: quotation.discount,
        discountType: quotation.discountType || "percentage",
        total: quotation.total,
        amountPaid: 0,
        notes: quotation.notes,
        terms: quotation.terms,
        companyId: quotation.companyId,
        clientId: quotation.clientId,
        items: {
          create: quotation.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        },
      },
      include: {
        client: true,
        company: true,
        items: true,
      },
    });

    await prisma.quotation.update({
      where: { id },
      data: {
        status: "accepted",
        convertedToInvoiceId: invoice.id,
      },
    });

    return Response.json(invoice, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to convert quotation" }, { status: 500 });
  }
}
