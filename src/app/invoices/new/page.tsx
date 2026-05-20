"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import InvoiceForm from "@/components/invoice/invoice-form"
import type { Client } from "@/components/invoice/invoice-form"
import { Loader2 } from "lucide-react"

export default function NewInvoicePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        setClients(data.clients || data || [])
      })
      .catch(() => setError("Failed to load clients"))
      .finally(() => setLoadingClients(false))
  }, [])

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || err.error || err.message || "Failed to create invoice")
      }
      const invoice = await res.json()
      router.push(`/invoices/${invoice.id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">New Invoice</h1>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <InvoiceForm onSubmit={handleSubmit} isSubmitting={isSubmitting} clients={clients} loading={loadingClients} />
        </div>

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating invoice...
          </div>
        )}
      </div>
    </div>
  )
}
