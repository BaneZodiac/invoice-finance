import { prisma } from "./db";

async function main() {
  const existingCompany = await prisma.company.findFirst();
  if (existingCompany) {
    console.log("Database already has data, skipping seed.");
    return;
  }

  const company = await prisma.company.create({
    data: {
      name: "Nomads Eco",
      email: "hello@nomadseco.com",
      phone: "+1 (555) 123-4567",
      address: "123 Eco Street",
      city: "Portland",
      state: "OR",
      zip: "97201",
      country: "USA",
      taxId: "XX-XXXXXXX",
      currency: "USD",
      invoiceNote: "Thank you for your business!",
    },
  });

  const client = await prisma.client.create({
    data: {
      name: "Green Planet Corp",
      email: "billing@greenplanet.com",
      phone: "+1 (555) 987-6543",
      address: "456 Sustainable Ave",
      city: "Seattle",
      state: "WA",
      zip: "98101",
      country: "USA",
    },
  });

  const accounts = [
    { code: "1000", name: "Cash", type: "asset", subtype: "current" },
    { code: "1100", name: "Accounts Receivable", type: "asset", subtype: "current" },
    { code: "2000", name: "Accounts Payable", type: "liability", subtype: "current" },
    { code: "3000", name: "Owner's Equity", type: "equity", subtype: "" },
    { code: "4000", name: "Service Revenue", type: "revenue", subtype: "operating" },
    { code: "6000", name: "Salaries Expense", type: "expense", subtype: "operating" },
  ];

  for (const acc of accounts) {
    await prisma.account.create({ data: acc });
  }

  await prisma.invoice.create({
    data: {
      number: "INV-2024-0001",
      status: "paid",
      issueDate: new Date("2024-01-15"),
      dueDate: new Date("2024-02-15"),
      paidAt: new Date("2024-02-01"),
      subtotal: 5000,
      taxRate: 10,
      taxAmount: 500,
      discount: 0,
      total: 5500,
      amountPaid: 5500,
      companyId: company.id,
      clientId: client.id,
      items: {
        create: [
          { description: "Consulting Services", quantity: 20, unitPrice: 200, amount: 4000 },
          { description: "Design Package", quantity: 1, unitPrice: 1000, amount: 1000 },
        ],
      },
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
