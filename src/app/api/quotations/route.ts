import { prisma } from "@/lib/db";
import { calculateInvoice, generateQuotationNumber } from "@/lib/utils";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        client: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(quotations);
  } catch (error) {
    return Response.json({ error: "Failed to fetch quotations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, ...quotationData } = body;

    const calculated = calculateInvoice(
      quotationData.subtotal || 0,
      quotationData.taxRate || 0,
      quotationData.discount || 0
    );

    const quotation = await prisma.quotation.create({
      data: {
        number: quotationData.number || generateQuotationNumber(),
        status: quotationData.status || "draft",
        issueDate: quotationData.issueDate ? new Date(quotationData.issueDate) : new Date(),
        validUntil: new Date(quotationData.validUntil),
        subtotal: calculated.subtotal,
        taxRate: quotationData.taxRate || 0,
        taxAmount: calculated.taxAmount,
        discount: quotationData.discount || 0,
        total: calculated.total,
        notes: quotationData.notes || "",
        terms: quotationData.terms || "",
        companyId: quotationData.companyId,
        clientId: quotationData.clientId,
        items: {
          create: items?.map((item: { description: string; quantity: number; unitPrice: number }) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            amount: (item.quantity || 1) * (item.unitPrice || 0),
          })) || [],
        },
      },
      include: {
        client: true,
        company: true,
        items: true,
      },
    });

    return Response.json(quotation, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to create quotation" }, { status: 500 });
  }
}
