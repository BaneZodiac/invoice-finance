import { prisma } from "./db";

const DEFAULT_ACCOUNTS = [
  { code: "1000", name: "Cash", type: "asset", subtype: "current" },
  { code: "1100", name: "Accounts Receivable", type: "asset", subtype: "current" },
  { code: "1200", name: "Inventory", type: "asset", subtype: "current" },
  { code: "1300", name: "Fixed Assets", type: "asset", subtype: "non-current" },
  { code: "2000", name: "Accounts Payable", type: "liability", subtype: "current" },
  { code: "2100", name: "Tax Payable", type: "liability", subtype: "current" },
  { code: "3000", name: "Owner's Equity", type: "equity", subtype: "" },
  { code: "3100", name: "Retained Earnings", type: "equity", subtype: "" },
  { code: "4000", name: "Service Revenue", type: "revenue", subtype: "operating" },
  { code: "4100", name: "Product Revenue", type: "revenue", subtype: "operating" },
  { code: "5000", name: "Cost of Goods Sold", type: "expense", subtype: "cogs" },
  { code: "6000", name: "Salaries Expense", type: "expense", subtype: "operating" },
  { code: "6100", name: "Rent Expense", type: "expense", subtype: "operating" },
  { code: "6200", name: "Utilities Expense", type: "expense", subtype: "operating" },
  { code: "6300", name: "Office Supplies", type: "expense", subtype: "operating" },
  { code: "6400", name: "Travel Expense", type: "expense", subtype: "operating" },
  { code: "6500", name: "Marketing Expense", type: "expense", subtype: "operating" },
  { code: "7000", name: "Other Expense", type: "expense", subtype: "other" },
];

export async function seedAccounts(companyId: string) {
  const existing = await prisma.account.findFirst();
  if (existing) return;

  for (const acc of DEFAULT_ACCOUNTS) {
    await prisma.account.create({ data: acc });
  }
}

export async function recordTransaction(
  data: {
    date: Date;
    description: string;
    debitAccountCode: string;
    creditAccountCode: string;
    amount: number;
    companyId: string;
    reference?: string;
    invoiceId?: string;
  }
) {
  const debitAccount = await prisma.account.findUnique({ where: { code: data.debitAccountCode } });
  const creditAccount = await prisma.account.findUnique({ where: { code: data.creditAccountCode } });

  if (!debitAccount || !creditAccount) {
    throw new Error("Invalid account codes");
  }

  await prisma.transaction.create({
    data: {
      date: data.date,
      description: data.description,
      debitAmount: data.amount,
      creditAmount: data.amount,
      debitAccountId: debitAccount.id,
      creditAccountId: creditAccount.id,
      companyId: data.companyId,
      reference: data.reference || "",
      invoiceId: data.invoiceId,
    },
  });

  await prisma.account.update({
    where: { id: debitAccount.id },
    data: { balance: { increment: data.amount } },
  });

  await prisma.account.update({
    where: { id: creditAccount.id },
    data: { balance: { decrement: data.amount } },
  });
}

export async function getTrialBalance(companyId: string) {
  const accounts = await prisma.account.findMany({
    orderBy: { code: "asc" },
  });

  return accounts.map((a) => ({
    code: a.code,
    name: a.name,
    type: a.type,
    debitBalance: a.balance > 0 ? a.balance : 0,
    creditBalance: a.balance < 0 ? Math.abs(a.balance) : 0,
  }));
}

export async function getIncomeStatement(companyId: string) {
  const accounts = await prisma.account.findMany();
  const revenues = accounts.filter((a) => a.type === "revenue");
  const expenses = accounts.filter((a) => a.type === "expense");

  const totalRevenue = revenues.reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = expenses.reduce((sum, a) => sum + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;

  return { revenues, expenses, totalRevenue, totalExpenses, netIncome };
}

export async function getBalanceSheet(companyId: string) {
  const accounts = await prisma.account.findMany();
  const assets = accounts.filter((a) => a.type === "asset");
  const liabilities = accounts.filter((a) => a.type === "liability");
  const equity = accounts.filter((a) => a.type === "equity");

  const totalAssets = assets.reduce((sum, a) => sum + Math.abs(a.balance), 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + Math.abs(a.balance), 0);
  const totalEquity = equity.reduce((sum, a) => sum + Math.abs(a.balance), 0);

  return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity };
}
