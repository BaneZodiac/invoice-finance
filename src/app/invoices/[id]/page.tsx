"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download, Send, Edit, Trash2, Loader2 } from "lucide-react"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"
import InvoicePDF from "@/components/invoice/invoice-pdf"

type Invoice = {
  id: string
  number: string
  status: string
  issueDate: string
  dueDate: string
  paidAt: string | null
  notes: string | null
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  client: { id: string; name: string; email: string; address: string | null; phone: string | null }
  items: { id: string; description: string; quantity: number; unitPrice: number; amount: number }[]
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState("")

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      })
      .then(setInvoice)
      .catch(() => setError("Invoice not found"))
      .finally(() => setLoading(false))
  }, [id])

  const handleAction = async (action: string) => {
    setActionLoading(action)
    setError("")
    const statusMap: Record<string, string> = { send: "sent", "mark-paid": "paid" }
    try {
      const res = await fetch(`/api/invoices/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusMap[action] || action }),
      })
      if (res.ok) {
        const updated = await res.json()
        setInvoice(updated)
      } else {
        const err = await res.json()
        setError(err.error || err.message || "Failed to update status")
      }
    } catch {
      setError("Failed to update status")
    }
    setActionLoading("")
  }

  const handleDelete = async () => {
    setActionLoading("delete")
    setError("")
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
      if (res.ok) router.push("/invoices")
      else {
        const err = await res.json()
        setError(err.error || err.message || "Failed to delete")
      }
    } catch {
      setError("Failed to delete invoice")
    }
    setActionLoading("")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-gray-500">{error}</p>
        <Link href="/invoices" className="text-sm text-blue-600 hover:underline">
          Back to Invoices
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/invoices")} className="rounded p-1 text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">{invoice.number}</h1>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(invoice.status)}`}>
              {invoice.status}
            </span>
          </div>
          <div className="flex items-center gap-2 no-print">
            {invoice.status === "draft" && (
              <button
                onClick={() => handleAction("send")}
                disabled={actionLoading === "send"}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            )}
            {(invoice.status === "sent" || invoice.status === "overdue") && (
              <button
                onClick={() => handleAction("mark-paid")}
                disabled={actionLoading === "mark-paid"}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === "mark-paid" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Mark as Paid
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Print / PDF
            </button>
            <Link
              href={`/invoices/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            <button
              onClick={() => {
                if (confirm("Delete this invoice?")) handleDelete()
              }}
              disabled={actionLoading === "delete"}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {actionLoading === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 no-print">{error}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <div className="flex items-start justify-between border-b border-gray-200 pb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{invoice.number}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Issued: {formatDate(invoice.issueDate)}
                    <br />
                    Due: {formatDate(invoice.dueDate)}
                    {invoice.paidAt && <>Paid: {formatDate(invoice.paidAt)}</>}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-medium uppercase text-gray-500">Bill To</h3>
                  <p className="mt-2 text-sm font-medium text-gray-900">{invoice.client.name}</p>
                  {invoice.client.address && <p className="mt-1 text-sm text-gray-600">{invoice.client.address}</p>}
                  <p className="mt-1 text-sm text-gray-600">{invoice.client.email}</p>
                  {invoice.client.phone && <p className="text-sm text-gray-600">{invoice.client.phone}</p>}
                </div>
              </div>

              <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="mt-8 w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3 text-right">Unit Price</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 text-sm text-gray-900">{item.description}</td>
                      <td className="py-4 text-sm text-gray-600">{item.quantity}</td>
                      <td className="py-4 text-right text-sm text-gray-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="ml-auto w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({invoice.taxRate}%)</span>
                    <span className="text-gray-900">{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h3 className="text-xs font-medium uppercase text-gray-500">Notes</h3>
                  <p className="mt-2 text-sm text-gray-600">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 no-print">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="space-y-2">
                <InvoicePDF invoice={{ ...invoice, notes: invoice.notes ?? undefined, client: { ...invoice.client, address: invoice.client.address ?? undefined, phone: invoice.client.phone ?? undefined } }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
