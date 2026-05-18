import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
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
    const client = await prisma.client.create({ data: body });
    return Response.json(client, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to create client" }, { status: 500 });
  }
}
