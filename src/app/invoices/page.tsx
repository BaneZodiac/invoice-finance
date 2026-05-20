"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, Eye, Download, Trash2, MoreHorizontal, Loader2 } from "lucide-react"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"

type Invoice = {
  id: string
  number: string
  status: string
  issueDate: string
  dueDate: string
  total: number
  client: { id: string; name: string }
}

const statuses = ["all", "draft", "sent", "paid", "overdue", "cancelled"]

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (search) params.set("search", search)
      const res = await fetch(`/api/invoices?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setInvoices(data.invoices ?? [])
    } catch {
      setError("Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Delete this invoice?")) return
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
      if (res.ok) setInvoices((prev) => prev.filter((i) => i.id !== id))
    } catch {}
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize ${
                statusFilter === s ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="py-20 text-center text-sm text-red-500">{error}</div>
          ) : invoices.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-500">No invoices found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-6 py-3">Number</th>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">Issue Date</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => router.push(`/invoices/${inv.id}`)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.number}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.client?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(inv.issueDate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(inv.dueDate)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(inv.total)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(inv.status)}`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/invoices/${inv.id}`)
                            }}
                            className="rounded p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.print()
                            }}
                            className="rounded p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(inv.id, e)}
                            className="rounded p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
