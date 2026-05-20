import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        _count: { select: { invoices: true, quotations: true } },
      },
    });

    const groups = new Map<string, typeof clients>();
    for (const client of clients) {
      const key = client.name.toLowerCase().trim();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(client);
    }

    const deleted: string[] = [];
    for (const [, group] of groups) {
      if (group.length <= 1) continue;
      group.sort((a, b) => {
        const aScore = a._count.invoices + a._count.quotations;
        const bScore = b._count.invoices + b._count.quotations;
        if (bScore !== aScore) return bScore - aScore;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      const keep = group[0];
      for (let i = 1; i < group.length; i++) {
        const dup = group[i];
        await prisma.invoice.updateMany({ where: { clientId: dup.id }, data: { clientId: keep.id } });
        await prisma.quotation.updateMany({ where: { clientId: dup.id }, data: { clientId: keep.id } });
        await prisma.client.delete({ where: { id: dup.id } });
        deleted.push(dup.name);
      }
    }

    return Response.json({ deleted, count: deleted.length });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return Response.json({ error: "Failed to deduplicate clients", detail }, { status: 500 });
  }
}
