"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { getDefaultCurrency } from "@/lib/utils";

interface CompanyInfo {
  name: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  email?: string;
  phone?: string;
  gst?: string;
  website?: string;
  mobile?: string;
}

interface ClientInfo {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  email?: string;
  phone?: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  total?: number;
}

interface InvoiceData {
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount?: number;
  discountAmount?: number;
  discountType?: string;
  total: number;
  client: {
    name: string;
    email: string;
    address?: string;
    phone?: string;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount?: number;
    total?: number;
  }[];
}

interface InvoicePdfProps {
  invoiceNumber?: string;
  status?: string;
  issueDate?: string;
  dueDate?: string;
  company?: CompanyInfo;
  client?: ClientInfo;
  items?: LineItem[];
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  discountAmount?: number;
  discountType?: string;
  total?: number;
  notes?: string;
  terms?: string;
  currency?: string;
  invoice?: InvoiceData;
  className?: string;
}

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function InvoicePdf(props: InvoicePdfProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const data = props.invoice;

  const invoiceNumber = props.invoiceNumber ?? data?.number ?? "";
  const status = props.status ?? data?.status ?? "draft";
  const issueDate = props.issueDate ?? data?.issueDate ?? "";
  const dueDate = props.dueDate ?? data?.dueDate ?? "";
  const invoiceNotes = props.notes ?? data?.notes ?? "";
  const invoiceSubtotal = props.subtotal ?? data?.subtotal ?? 0;
  const invoiceTaxRate = props.taxRate ?? data?.taxRate ?? 0;
  const invoiceTaxAmount = props.taxAmount ?? data?.taxAmount ?? 0;
  const invoiceDiscount = props.discount ?? data?.discount ?? 0;
  const invoiceDiscountAmount = props.discountAmount ?? data?.discountAmount ?? 0;
  const invoiceTotal = props.total ?? data?.total ?? 0;
  const currency = props.currency || getDefaultCurrency();

  const companyInfo = props.company;
  const companyName = companyInfo?.name || "Nomads Finance";
  const companyLogo = companyInfo?.logo || "";

  const clientInfo = props.client ?? data?.client;
  const clientName = clientInfo?.name ?? "";
  const clientEmail = clientInfo?.email ?? "";
  const clientAddress = clientInfo?.address ?? "";
  const clientPhone = clientInfo?.phone ?? "";

  const itemsList = props.items ?? data?.items ?? [];

  const resolvedItems: LineItem[] = itemsList.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: item.amount ?? item.total ?? item.quantity * item.unitPrice,
  }));

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const { default: html2canvas } = await import("html2canvas-pro");
    const { default: jsPDF } = await import("jspdf");

    const element = printRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
    const imgWidth = canvasWidth * ratio;
    const imgHeight = canvasHeight * ratio;

    let heightLeft = imgHeight;
    let position = 0;
    const pageHeight = pdfHeight;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${invoiceNumber}.pdf`);
  };

  return (
    <div className={cn("space-y-4 print:space-y-0", props.className)}>
      <div className="flex items-center justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-1" /> Print
        </Button>
        <Button variant="primary" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-1" /> Download PDF
        </Button>
      </div>

      <div
        ref={printRef}
        id="invoice-pdf"
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 print:shadow-none print:border-none print:p-0"
      >
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ paddingBottom: "32px" }}>
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ verticalAlign: "top" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          {companyLogo && (
                            <img src={companyLogo} alt="" style={{ height: "32px", width: "32px", objectFit: "contain", borderRadius: "4px" }} />
                          )}
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#111827" }}>
                            {companyName}
                          </div>
                        </div>
                        {props.company?.gst && (
                          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                            GST: {props.company.gst}
                          </div>
                        )}
                        {props.company?.website && (
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            {props.company.website}
                          </div>
                        )}
                        {props.company?.email && (
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            {props.company.email}
                          </div>
                        )}
                        {props.company?.mobile && (
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            {props.company.mobile}
                          </div>
                        )}
                        {props.company?.phone && (
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            {props.company.phone}
                          </div>
                        )}
                        {props.company?.address && (
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            {props.company.address}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right", verticalAlign: "top" }}>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: "#2563eb", marginBottom: "4px" }}>
                          INVOICE
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                          <span style={{ fontWeight: "600", color: "#374151" }}>Number:</span>{" "}
                          {invoiceNumber}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                          <span style={{ fontWeight: "600", color: "#374151" }}>Status:</span>{" "}
                          <span
                            style={{
                              display: "inline-block",
                              padding: "1px 8px",
                              borderRadius: "9999px",
                              fontSize: "11px",
                              fontWeight: "600",
                              backgroundColor:
                                status === "paid"
                                  ? "#dcfce7"
                                  : status === "overdue"
                                  ? "#fee2e2"
                                  : status === "sent"
                                  ? "#dbeafe"
                                  : "#f3f4f6",
                              color:
                                status === "paid"
                                  ? "#166534"
                                  : status === "overdue"
                                  ? "#991b1b"
                                  : status === "sent"
                                  ? "#1e40af"
                                  : "#374151",
                            }}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                          <span style={{ fontWeight: "600", color: "#374151" }}>Issue Date:</span>{" "}
                          {formatDate(issueDate)}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                          <span style={{ fontWeight: "600", color: "#374151" }}>Due Date:</span>{" "}
                          {formatDate(dueDate)}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td style={{ paddingBottom: "32px" }}>
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ verticalAlign: "top", width: "50%" }}>
                        <div style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", marginBottom: "4px" }}>
                          Bill To
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
                          {clientName}
                        </div>
                        {clientAddress && (
                          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                            {clientAddress}
                          </div>
                        )}
                        {clientEmail && (
                          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                            {clientEmail}
                          </div>
                        )}
                        {clientPhone && (
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            {clientPhone}
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td style={{ paddingBottom: "24px" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    borderTop: "2px solid #e5e7eb",
                    borderBottom: "2px solid #e5e7eb",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "left",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "#6b7280",
                        }}
                      >
                        Description
                      </th>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "#6b7280",
                        }}
                      >
                        Qty
                      </th>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "#6b7280",
                        }}
                      >
                        Unit Price
                      </th>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "#6b7280",
                        }}
                      >
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolvedItems.map((item, index) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom: index < resolvedItems.length - 1 ? "1px solid #f3f4f6" : "none",
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 12px",
                            fontSize: "13px",
                            color: "#111827",
                          }}
                        >
                          {item.description}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontSize: "13px",
                            color: "#374151",
                            textAlign: "right",
                          }}
                        >
                          {item.quantity}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontSize: "13px",
                            color: "#374151",
                            textAlign: "right",
                          }}
                        >
                          {formatCurrency(item.unitPrice, currency)}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#111827",
                            textAlign: "right",
                          }}
                        >
                          {formatCurrency(item.amount, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td>
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "60%", verticalAlign: "top", paddingRight: "24px" }}>
                        {invoiceNotes && (
                          <div style={{ marginBottom: "16px" }}>
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                color: "#6b7280",
                                marginBottom: "4px",
                              }}
                            >
                              Notes
                            </div>
                            <div style={{ fontSize: "12px", color: "#374151", whiteSpace: "pre-wrap" }}>
                              {invoiceNotes}
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ width: "40%", verticalAlign: "top" }}>
                        <table
                          className="w-full"
                          style={{ borderCollapse: "collapse" }}
                        >
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  padding: "4px 0",
                                  fontSize: "13px",
                                  color: "#6b7280",
                                  textAlign: "right",
                                }}
                              >
                                Subtotal
                              </td>
                              <td
                                style={{
                                  padding: "4px 0 4px 16px",
                                  fontSize: "13px",
                                  color: "#374151",
                                  textAlign: "right",
                                  fontWeight: "500",
                                }}
                              >
                                {formatCurrency(invoiceSubtotal, currency)}
                              </td>
                            </tr>
                            {invoiceDiscount > 0 && (
                              <tr>
                                <td
                                  style={{
                                    padding: "4px 0",
                                    fontSize: "13px",
                                    color: "#dc2626",
                                    textAlign: "right",
                                  }}
                                >
                                  Discount {data?.discountType === "fixed" ? `($${invoiceDiscount.toFixed(2)})` : `(${invoiceDiscount}%)`}
                                </td>
                                <td
                                  style={{
                                    padding: "4px 0 4px 16px",
                                    fontSize: "13px",
                                    color: "#dc2626",
                                    textAlign: "right",
                                    fontWeight: "500",
                                  }}
                                >
                                  -{formatCurrency(invoiceDiscountAmount, currency)}
                                </td>
                              </tr>
                            )}
                            {invoiceTaxRate > 0 && (
                              <tr>
                                <td
                                  style={{
                                    padding: "4px 0",
                                    fontSize: "13px",
                                    color: "#6b7280",
                                    textAlign: "right",
                                  }}
                                >
                                  Tax ({invoiceTaxRate}%)
                                </td>
                                <td
                                  style={{
                                    padding: "4px 0 4px 16px",
                                    fontSize: "13px",
                                    color: "#374151",
                                    textAlign: "right",
                                    fontWeight: "500",
                                  }}
                                >
                                  {formatCurrency(invoiceTaxAmount, currency)}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td
                                style={{
                                  padding: "8px 0 4px",
                                  borderTop: "2px solid #111827",
                                  fontSize: "15px",
                                  fontWeight: "700",
                                  color: "#111827",
                                  textAlign: "right",
                                }}
                              >
                                Total
                              </td>
                              <td
                                style={{
                                  padding: "8px 0 4px 16px",
                                  borderTop: "2px solid #111827",
                                  fontSize: "15px",
                                  fontWeight: "700",
                                  color: "#111827",
                                  textAlign: "right",
                                }}
                              >
                                {formatCurrency(invoiceTotal, currency)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style={{
            marginTop: "32px",
            paddingTop: "16px",
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
            fontSize: "11px",
            color: "#9ca3af",
          }}
        >
          Thank you for your business!
        </div>
      </div>
    </div>
  );
}

InvoicePdf.displayName = "InvoicePdf";

export default InvoicePdf;
export { InvoicePdf };
export type { InvoicePdfProps, CompanyInfo, ClientInfo, LineItem };
