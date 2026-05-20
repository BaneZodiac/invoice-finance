import { v4 as uuidv4 } from "uuid";

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${year}-${random}`;
}

export function generateQuotationNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `QTN-${year}-${random}`;
}

let _defaultCurrency = "USD";

export function setDefaultCurrency(c: string) {
  _defaultCurrency = c;
}

export function getDefaultCurrency() {
  return _defaultCurrency;
}

export function calculateInvoice(subtotal: number, taxRate: number, discount: number, discountType = "percentage") {
  let discountAmount = 0;
  if (discountType === "fixed") {
    discountAmount = discount;
  } else {
    discountAmount = subtotal * (discount / 100);
  }
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function formatCurrency(amount: number, currency?: string): string {
  const c = currency || _defaultCurrency || "USD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: c,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-500",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    expired: "bg-yellow-100 text-yellow-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
