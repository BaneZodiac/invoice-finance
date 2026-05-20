import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search");
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { invoices: true } },
      },
    });

    const clientsWithTotals = await Promise.all(
      clients.map(async (client) => {
        const result = await prisma.invoice.aggregate({
          where: { clientId: client.id },
          _sum: { total: true },
        });
        return {
          ...client,
          totalBilled: result._sum.total || 0,
        };
      })
    );

    return Response.json(clientsWithTotals);
  } catch (error) {
    return Response.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.name) {
      const existing = await prisma.client.findFirst({
        where: { name: { equals: body.name } },
      });
      if (existing) {
        return Response.json({ error: "A client with this name already exists" }, { status: 409 });
      }
    }
    const client = await prisma.client.create({ data: body });
    return Response.json(client, { status: 201 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return Response.json({ error: "Failed to create client", detail }, { status: 500 });
  }
}
