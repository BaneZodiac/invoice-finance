"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Search, Mail, Phone, MapPin, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

type Client = {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  _count: { invoices: number }
  totalBilled: number
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const res = await fetch(`/api/clients?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setClients(data)
    } catch {
      setError("Failed to load clients")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchClients() }, [fetchClients])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Client
          </Link>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-red-500">{error}</div>
        ) : clients.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-500">No clients found.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <div
                key={client.id}
                onClick={() => router.push(`/clients/${client.id}`)}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-6 hover:shadow-sm"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="h-4 w-4" />
                      {client.phone}
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      {client.address}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-sm text-gray-500">{client._count.invoices} invoices</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(client.totalBilled)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
