import { prisma } from "@/lib/db";
import { calculateInvoice, generateInvoiceNumber } from "@/lib/utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const status = url.searchParams.get("status");
    const clientId = url.searchParams.get("clientId");
    const search = url.searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { client: { name: { contains: search } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return Response.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return Response.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, ...invoiceData } = body;

    const calculated = calculateInvoice(
      invoiceData.subtotal || 0,
      invoiceData.taxRate || 0,
      invoiceData.discount || 0
    );

    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceData.number || generateInvoiceNumber(),
        status: invoiceData.status || "draft",
        type: invoiceData.type || "invoice",
        issueDate: invoiceData.issueDate ? new Date(invoiceData.issueDate) : new Date(),
        dueDate: new Date(invoiceData.dueDate),
        subtotal: calculated.subtotal,
        taxRate: invoiceData.taxRate || 0,
        taxAmount: calculated.taxAmount,
        discount: invoiceData.discount || 0,
        total: calculated.total,
        amountPaid: invoiceData.amountPaid || 0,
        notes: invoiceData.notes || "",
        terms: invoiceData.terms || "",
        companyId: invoiceData.companyId,
        clientId: invoiceData.clientId,
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

    return Response.json(invoice, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
