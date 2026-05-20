"use client"

import { useState, useEffect } from "react"
import { Loader2, Download, FileText, TrendingUp, PieChart as PieChartIcon } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

type ReportData = {
  monthlyRevenue: { month: string; revenue: number; expenses: number; profit: number }[]
  incomeVsExpenses: { month: string; income: number; expenses: number }[]
  categoryBreakdown: { name: string; value: number }[]
  statusBreakdown: { name: string; value: number }[]
  totalRevenue: number
  totalExpenses: number
  totalProfit: number
  invoiceCount: number
  paidCount: number
  overdueCount: number
}

const COLORS = ["#2563eb", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports?year=${year}`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/reports/export?year=${year}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `financial-report-${year}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {}
    setExporting(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Failed to load reports.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <div className="flex items-center gap-3">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(data.totalRevenue)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-medium text-gray-500">Total Expenses</p>
            <p className="mt-1 text-2xl font-semibold text-red-600">{formatCurrency(data.totalExpenses)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-medium text-gray-500">Net Profit</p>
            <p className={`mt-1 text-2xl font-semibold ${data.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(data.totalProfit)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-medium text-gray-500">Invoices</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {data.paidCount}/{data.invoiceCount} paid
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Income vs Expenses</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.incomeVsExpenses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" fill="#2563eb" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Expense Categories</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={(entry: any) => `${entry.name ?? ""} ${((entry.percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {data.categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Invoice Status</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={(entry: any) => `${entry.name ?? ""} ${((entry.percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {data.statusBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Monthly Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Expenses</th>
                  <th className="px-4 py-3 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.monthlyRevenue.map((row) => (
                  <tr key={row.month} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.month}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(row.revenue)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(row.expenses)}</td>
                    <td className={`px-4 py-3 text-right text-sm font-medium ${row.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(row.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
