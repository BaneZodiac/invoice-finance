"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, Trash2, Loader2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

type Expense = {
  id: string
  description: string
  amount: number
  category: string
  date: string
  notes: string | null
}

const categories = ["all", "office", "utilities", "travel", "supplies", "software", "maintenance", "other"]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ description: "", amount: "", category: "other", date: "", notes: "" })
  const [saving, setSaving] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== "all") params.set("category", categoryFilter)
      if (search) params.set("search", search)
      const res = await fetch(`/api/expenses?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setExpenses(data)
    } catch {
      setError("Failed to load expenses")
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, search])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          amount: parseFloat(form.amount),
          category: form.category,
          date: form.date,
          notes: form.notes || null,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ description: "", amount: "", category: "other", date: "", notes: "" })
        fetchExpenses()
      }
    } catch {}
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      if (res.ok) setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch {}
  }

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Cancel" : "Add Expense"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  {categories.filter((c) => c !== "all").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Expense
            </button>
          </form>
        )}

        <div className="flex items-center justify-between">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize ${
                categoryFilter === c ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {c}
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
          ) : expenses.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-500">No expenses found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{exp.description}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(exp.date)}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(exp.amount)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="rounded p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
