"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, Edit, Trash2, FileText, Loader2, Copy } from "lucide-react"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"
import { useSettings } from "@/contexts/settings-context"
import InvoicePDF from "@/components/invoice/invoice-pdf"

type Quotation = {
  id: string
  number: string
  status: string
  issueDate: string
  validUntil: string
  notes: string | null
  subtotal: number
  taxRate: number
  taxAmount: number
  discount: number
  discountType: string
  total: number
  client: { id: string; name: string; email: string; address: string | null; phone: string | null }
  items: { id: string; description: string; quantity: number; unitPrice: number; amount: number }[]
}

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { settings } = useSettings()
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState("")

  useEffect(() => {
    fetch(`/api/quotations/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      })
      .then(setQuotation)
      .catch(() => setError("Quotation not found"))
      .finally(() => setLoading(false))
  }, [id])

  const handleAction = async (action: string) => {
    setActionLoading(action)
    setError("")
    const statusMap: Record<string, string> = { send: "sent", accept: "accepted", reject: "rejected" }
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusMap[action] || action }),
      })
      if (res.ok) {
        const updated = await res.json()
        setQuotation(updated)
      } else {
        const err = await res.json()
        setError(err.error || err.message || "Failed to update status")
      }
    } catch {
      setError("Failed to update status")
    }
    setActionLoading("")
  }

  const convertToInvoice = async () => {
    setActionLoading("convert")
    setError("")
    try {
      const res = await fetch(`/api/quotations/${id}/convert`, { method: "POST" })
      if (res.ok) {
        const invoice = await res.json()
        router.push(`/invoices/${invoice.id}`)
      } else {
        const err = await res.json()
        setError(err.error || err.message || "Failed to convert")
      }
    } catch {
      setError("Failed to convert to invoice")
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

  if (error || !quotation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-gray-500">{error}</p>
        <Link href="/quotations" className="text-sm text-blue-600 hover:underline">
          Back to Quotations
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/quotations")} className="rounded p-1 text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">{quotation.number}</h1>
            <div className="relative">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(quotation.status)}`}>
                {quotation.status}
              </span>
              <select
                value={quotation.status}
                onChange={async (e) => {
                  const newStatus = e.target.value
                  setActionLoading("status")
                  setError("")
                  try {
                    const res = await fetch(`/api/quotations/${id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: newStatus }),
                    })
                    if (res.ok) {
                      const updated = await res.json()
                      setQuotation(updated)
                    } else {
                      const err = await res.json()
                      setError(err.error || err.message || "Failed to update status")
                    }
                  } catch {
                    setError("Failed to update status")
                  }
                  setActionLoading("")
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                <option value="draft">draft</option>
                <option value="sent">sent</option>
                <option value="accepted">accepted</option>
                <option value="rejected">rejected</option>
                <option value="expired">expired</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 no-print">
            {quotation.status === "draft" && (
              <button
                onClick={() => handleAction("send")}
                disabled={actionLoading === "send"}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            )}
            {(quotation.status === "sent" || quotation.status === "accepted") && (
              <button
                onClick={convertToInvoice}
                disabled={actionLoading === "convert"}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === "convert" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Convert to Invoice
              </button>
            )}
            <Link
              href={`/quotations/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            <button
              onClick={async () => {
                setActionLoading("duplicate")
                setError("")
                try {
                  const res = await fetch(`/api/quotations/${id}/duplicate`, { method: "POST" })
                  if (res.ok) {
                    const dup = await res.json()
                    router.push(`/quotations/${dup.id}`)
                  } else {
                    const err = await res.json()
                    setError(err.error || err.message || "Failed to duplicate")
                  }
                } catch {
                  setError("Failed to duplicate quotation")
                }
                setActionLoading("")
              }}
              disabled={actionLoading === "duplicate"}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {actionLoading === "duplicate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              Duplicate
            </button>
            <button
              onClick={async () => {
                if (!confirm("Delete this quotation?")) return
                setActionLoading("delete")
                setError("")
                try {
                  const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" })
                  if (res.ok) router.push("/quotations")
                  else {
                    const err = await res.json()
                    setError(err.error || err.message || "Failed to delete")
                  }
                } catch {
                  setError("Failed to delete quotation")
                }
                setActionLoading("")
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
                  <h2 className="text-xl font-bold text-gray-900">{quotation.number}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Issued: {formatDate(quotation.issueDate)}
                    <br />
                    Valid Until: {formatDate(quotation.validUntil)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-medium uppercase text-gray-500">From</h3>
                  <p className="mt-2 text-sm font-medium text-gray-900">{settings?.companyName || "Nomads Finance"}</p>
                  {settings?.gst && <p className="mt-1 text-sm text-gray-600">GST: {settings.gst}</p>}
                  {settings?.companyEmail && <p className="mt-1 text-sm text-gray-600">{settings.companyEmail}</p>}
              {settings?.mobile && <p className="text-sm text-gray-600">{settings.mobile}</p>}
              {settings?.companyPhone && <p className="text-sm text-gray-600">{settings.companyPhone}</p>}
              {settings?.website && <p className="text-sm text-gray-600">{settings.website}</p>}
              {settings?.upiId && <p className="text-sm text-gray-600">UPI: {settings.upiId}</p>}
                  {settings?.companyAddress && <p className="text-sm text-gray-600">{settings.companyAddress}</p>}
                </div>
                <div>
                  <h3 className="text-xs font-medium uppercase text-gray-500">Bill To</h3>
                  <p className="mt-2 text-sm font-medium text-gray-900">{quotation.client.name}</p>
                  {quotation.client.address && <p className="mt-1 text-sm text-gray-600">{quotation.client.address}</p>}
                  <p className="mt-1 text-sm text-gray-600">{quotation.client.email}</p>
                  {quotation.client.phone && <p className="text-sm text-gray-600">{quotation.client.phone}</p>}
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
                  {quotation.items.map((item) => (
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
                    <span className="text-gray-900">{formatCurrency(quotation.subtotal)}</span>
                  </div>
                  {quotation.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Discount {quotation.discountType === "fixed" ? `($${quotation.discount.toFixed(2)})` : `(${quotation.discount}%)`}</span>
                      <span>-{formatCurrency(quotation.discountType === "fixed" ? quotation.discount : quotation.subtotal * (quotation.discount / 100))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({quotation.taxRate}%)</span>
                    <span className="text-gray-900">{formatCurrency(quotation.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatCurrency(quotation.total)}</span>
                  </div>
                </div>
              </div>

              {quotation.notes && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h3 className="text-xs font-medium uppercase text-gray-500">Notes</h3>
                  <p className="mt-2 text-sm text-gray-600">{quotation.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 no-print">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="space-y-2">
                <InvoicePDF
                  title="QUOTATION"
                  dateLabel="Valid Until"
                  invoiceNumber={quotation.number}
                  status={quotation.status}
                  issueDate={quotation.issueDate}
                  dueDate={quotation.validUntil}
                  company={{
                    name: settings?.companyName || "Nomads Finance",
                    logo: settings?.logo || undefined,
                    email: settings?.companyEmail || undefined,
                    phone: settings?.companyPhone || undefined,
                    mobile: settings?.mobile || undefined,
                    upiId: settings?.upiId || undefined,
                    gst: settings?.gst || undefined,
                    website: settings?.website || undefined,
                    address: settings?.companyAddress || undefined,
                  }}
                  client={{
                    name: quotation.client.name,
                    email: quotation.client.email,
                    address: quotation.client.address || undefined,
                    phone: quotation.client.phone || undefined,
                  }}
                  items={quotation.items.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    amount: item.amount,
                  }))}
                  subtotal={quotation.subtotal}
                  taxRate={quotation.taxRate}
                  taxAmount={quotation.taxAmount}
                  discount={quotation.discount}
                  discountAmount={quotation.discountType === "fixed" ? quotation.discount : quotation.subtotal * (quotation.discount / 100)}
                  discountType={quotation.discountType}
                  total={quotation.total}
                  notes={quotation.notes || undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
