import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json(companies);
  } catch (error) {
    return Response.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const company = await prisma.company.create({ data: body });
    return Response.json(company, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to create company" }, { status: 500 });
  }
}
