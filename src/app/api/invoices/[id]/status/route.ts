import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, amountPaid } = body;

    const updateData: Record<string, unknown> = { status };

    if (status === "paid") {
      updateData.paidAt = new Date();
      if (amountPaid !== undefined) {
        updateData.amountPaid = amountPaid;
      }
    } else if (status === "sent" || status === "overdue") {
      updateData.paidAt = null;
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        company: true,
        items: true,
      },
    });

    return Response.json(invoice);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return Response.json({ error: "Failed to update invoice status", detail }, { status: 500 });
  }
}
