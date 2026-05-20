"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import InvoiceForm from "@/components/invoice/invoice-form"
import { Loader2 } from "lucide-react"

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ])
      .then(([inv, cls]) => {
        setInvoice(inv)
        setClients(cls)
      })
      .catch(() => setError("Failed to load invoice"))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || err.error || err.message || "Failed to update invoice")
      }
      router.push(`/invoices/${id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  if (error && !invoice) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50"><p className="text-gray-500">{error}</p></div>
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Invoice</h1>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <InvoiceForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            clients={clients}
            initialData={{
              clientId: invoice?.clientId || "",
              issueDate: invoice?.issueDate?.split("T")[0] || "",
              dueDate: invoice?.dueDate?.split("T")[0] || "",
              items: invoice?.items?.map((i: any) => ({ id: i.id, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, amount: i.amount })) || [],
              taxRate: invoice?.taxRate || 0,
              discount: invoice?.discount || 0,
              notes: invoice?.notes || "",
              terms: invoice?.terms || "",
              status: invoice?.status || "draft",
            }}
          />
        </div>
      </div>
    </div>
  )
}
