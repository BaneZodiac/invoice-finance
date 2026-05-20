"use client";

import React, { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Client {
  id: string;
  name: string;
}

interface InvoiceFormData {
  clientId: string;
  issueDate: string;
  dueDate: string;
  items: LineItem[];
  taxRate: number;
  discount: number;
  notes: string;
  terms: string;
  status: string;
}

interface InvoiceFormProps {
  initialData?: Partial<InvoiceFormData>;
  clients?: Client[];
  onSave?: (data: InvoiceFormData) => void;
  onSaveAsDraft?: (data: InvoiceFormData) => void;
  onPreview?: (data: InvoiceFormData) => void;
  onSubmit?: (data: InvoiceFormData) => void;
  isSubmitting?: boolean;
  loading?: boolean;
  quotation?: boolean;
  className?: string;
}

function generateLineItemId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function calculateAmount(qty: number, price: number): number {
  return Math.round(qty * price * 100) / 100;
}

function InvoiceForm({
  initialData,
  clients = [],
  onSave,
  onSaveAsDraft,
  onPreview,
  onSubmit,
  isSubmitting = false,
  loading = false,
  quotation = false,
  className,
}: InvoiceFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .split("T")[0];

  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: initialData?.clientId || "",
    issueDate: initialData?.issueDate || today,
    dueDate: initialData?.dueDate || thirtyDaysLater,
    items: initialData?.items || [
      { id: generateLineItemId(), description: "", quantity: 1, unitPrice: 0, amount: 0 },
    ],
    taxRate: initialData?.taxRate ?? 0,
    discount: initialData?.discount ?? 0,
    notes: initialData?.notes || "",
    terms: initialData?.terms || "",
    status: initialData?.status || "draft",
  });

  const [newClientName, setNewClientName] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);

  const effectiveLoading = loading || isSubmitting;

  const updateField = <K extends keyof InvoiceFormData>(
    key: K,
    value: InvoiceFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setFormData((prev) => {
      const items = prev.items.map((item) => {
        if (item.id !== id) return item;
        const numValue = field === "quantity" || field === "unitPrice" ? Number(value) : value;
        const updated = { ...item, [field]: numValue };
        if (field === "quantity" || field === "unitPrice") {
          const qty = field === "quantity" ? Number(value) : (typeof item.quantity === "number" ? item.quantity : Number(item.quantity));
          const price = field === "unitPrice" ? Number(value) : (typeof item.unitPrice === "number" ? item.unitPrice : Number(item.unitPrice));
          updated.amount = calculateAmount(qty, price);
        }
        return updated;
      });
      return { ...prev, items };
    });
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: generateLineItemId(), description: "", quantity: 1, unitPrice: 0, amount: 0 },
      ],
    }));
  };

  const removeLineItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = subtotal * (formData.discount / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (formData.taxRate / 100);
  const total = taxableAmount + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let data = { ...formData };

    if (showNewClient) {
      const name = newClientName.trim();
      if (!name) return;
      try {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (res.ok) {
          const client = await res.json();
          data.clientId = client.id;
        } else {
          const err = await res.json();
          alert(err.error || err.message || "Failed to create client");
          return;
        }
      } catch {
        alert("Failed to create client");
        return;
      }
    }

    if (onSubmit) {
      onSubmit(data);
    } else if (onSave) {
      onSave(data);
    }
  };

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!showNewClient ? (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select
                    label="Client"
                    options={clientOptions}
                    placeholder="Select a client"
                    value={formData.clientId}
                    onChange={(e) => updateField("clientId", e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewClient(true)}
                >
                  + New
                </Button>
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="New Client Name"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Enter client name"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewClient(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{quotation ? "Quotation" : "Invoice"} Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Issue Date"
              type="date"
              value={formData.issueDate}
              onChange={(e) => updateField("issueDate", e.target.value)}
            />
            <Input
              label={quotation ? "Valid Until" : "Due Date"}
              type="date"
              value={formData.dueDate}
              onChange={(e) => updateField("dueDate", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-3 text-xs font-medium text-gray-500 uppercase tracking-wider px-1">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-right">Quantity</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1" />
            </div>
            {formData.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-3 items-center"
              >
                <div className="col-span-5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, "description", e.target.value)
                    }
                    placeholder="Item description"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, "quantity", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(item.id, "unitPrice", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2 text-right text-sm font-medium text-gray-900">
                  ${item.amount.toFixed(2)}
                </div>
                <div className="col-span-1 flex justify-center">
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addLineItem}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tax & Discount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Tax Rate (%)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.taxRate}
              onChange={(e) =>
                updateField("taxRate", Number(e.target.value))
              }
            />
            <Input
              label="Discount (%)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.discount}
              onChange={(e) =>
                updateField("discount", Number(e.target.value))
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount ({formData.discount}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {formData.taxRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Tax ({formData.taxRate}%)
                  </span>
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes & Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
              placeholder="Additional notes for the client..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Terms
            </label>
            <textarea
              value={formData.terms}
              onChange={(e) => updateField("terms", e.target.value)}
              rows={3}
              placeholder="Payment terms and conditions..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {onPreview && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onPreview(formData)}
          >
            Preview
          </Button>
        )}
        {onSaveAsDraft && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => onSaveAsDraft(formData)}
            loading={effectiveLoading}
          >
            Save as Draft
          </Button>
        )}
        <Button type="submit" loading={effectiveLoading}>
          {onSubmit ? (quotation ? "Create Quotation" : "Create Invoice") : "Save Invoice"}
        </Button>
      </div>
    </form>
  );
}

InvoiceForm.displayName = "InvoiceForm";

export default InvoiceForm;
export { InvoiceForm };
export type { InvoiceFormProps, InvoiceFormData, LineItem, Client };
