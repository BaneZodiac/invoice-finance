"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import InvoiceForm from "@/components/invoice/invoice-form"
import { Loader2 } from "lucide-react"

export default function NewQuotationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to create quotation")
      }
      const quotation = await res.json()
      router.push(`/quotations/${quotation.id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 space-y-6 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">New Quotation</h1>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <InvoiceForm onSubmit={handleSubmit} isSubmitting={isSubmitting} quotation />
        </div>

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating quotation...
          </div>
        )}
      </div>
    </div>
  )
}
