"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Mail, Phone, MapPin, Edit, FileText, Loader2, Trash2 } from "lucide-react"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"

type Client = {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  createdAt: string
  invoices: {
    id: string
    number: string
    status: string
    issueDate: string
    total: number
  }[]
  _count: { invoices: number }
  totalBilled: number
  totalOutstanding: number
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      })
      .then(setClient)
      .catch(() => setError("Client not found"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-gray-500">{error}</p>
        <Link href="/clients" className="text-sm text-blue-600 hover:underline">
          Back to Clients
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/clients")} className="rounded p-1 text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{client.name}</h1>
              <p className="text-sm text-gray-500">Client since {formatDate(client.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/invoices/new?clientId=${client.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <FileText className="h-4 w-4" />
              New Invoice
            </Link>
            <Link
              href={`/clients/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            <button
              onClick={() => {
                if (confirm(`Delete "${client.name}"? This cannot be undone.`)) {
                  fetch(`/api/clients/${id}`, { method: "DELETE" })
                    .then((r) => {
                      if (!r.ok) throw new Error()
                      router.push("/clients")
                    })
                    .catch(() => alert("Failed to delete client. Remove invoices/quotations first."))
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-medium text-gray-500">Total Billed</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(client.totalBilled)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-medium text-gray-500">Outstanding</p>
            <p className="mt-1 text-2xl font-semibold text-orange-600">{formatCurrency(client.totalOutstanding)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-medium text-gray-500">Total Invoices</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{client._count.invoices}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                {client.email}
              </div>
              {client.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {client.phone}
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                  {client.address}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-sm font-semibold text-gray-900">Invoice History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                      <th className="px-6 py-3">Invoice</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Total</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {client.invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        onClick={() => router.push(`/invoices/${inv.id}`)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-blue-600 hover:underline">{inv.number}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(inv.issueDate)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(inv.total)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(inv.status)}`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {client.invoices.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                          No invoices for this client yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
