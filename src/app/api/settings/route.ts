import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

async function getOrCreateCompany() {
  let company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  if (!company) {
    company = await prisma.company.create({ data: { name: "My Company" } });
  }
  return company;
}

function toSettings(company: { name: string; email: string; phone: string; address: string; logo: string; taxRate: number; currency: string; invoicePrefix: string; quotationPrefix: string; defaultPaymentTerms: number; defaultDueDays: number }) {
  return {
    companyName: company.name,
    companyEmail: company.email,
    companyPhone: company.phone,
    companyAddress: company.address,
    logo: company.logo,
    taxRate: company.taxRate,
    currency: company.currency,
    invoicePrefix: company.invoicePrefix,
    quotationPrefix: company.quotationPrefix,
    defaultPaymentTerms: company.defaultPaymentTerms,
    defaultDueDays: company.defaultDueDays,
  };
}

export async function GET() {
  try {
    const company = await getOrCreateCompany();
    return Response.json(toSettings(company));
  } catch (error) {
    return Response.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    let company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: body.companyName || "My Company",
          email: body.companyEmail || "",
          phone: body.companyPhone || "",
          address: body.companyAddress || "",
          logo: body.logo || "",
          taxRate: body.taxRate ?? 0,
          currency: body.currency || "USD",
          invoicePrefix: body.invoicePrefix || "INV-",
          quotationPrefix: body.quotationPrefix || "QTN-",
          defaultPaymentTerms: body.defaultPaymentTerms ?? 30,
          defaultDueDays: body.defaultDueDays ?? 30,
        },
      });
    } else {
      company = await prisma.company.update({
        where: { id: company.id },
        data: {
          name: body.companyName,
          email: body.companyEmail,
          phone: body.companyPhone,
          address: body.companyAddress,
          logo: body.logo,
          taxRate: body.taxRate,
          currency: body.currency,
          invoicePrefix: body.invoicePrefix,
          quotationPrefix: body.quotationPrefix,
          defaultPaymentTerms: body.defaultPaymentTerms,
          defaultDueDays: body.defaultDueDays,
        },
      });
    }
    return Response.json(toSettings(company));
  } catch (error) {
    return Response.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const company = await prisma.company.create({
      data: {
        name: body.companyName || "My Company",
        email: body.companyEmail || "",
        phone: body.companyPhone || "",
        address: body.companyAddress || "",
        logo: body.logo || "",
        taxRate: body.taxRate ?? 0,
        currency: body.currency || "USD",
        invoicePrefix: body.invoicePrefix || "INV-",
        quotationPrefix: body.quotationPrefix || "QTN-",
        defaultPaymentTerms: body.defaultPaymentTerms ?? 30,
        defaultDueDays: body.defaultDueDays ?? 30,
      },
    });
    return Response.json(toSettings(company), { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to create company" }, { status: 500 });
  }
}
