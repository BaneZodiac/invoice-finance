"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { setDefaultCurrency } from "@/lib/utils";

type Settings = {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  gst: string;
  website: string;
  mobile: string;
  logo: string | null;
  taxRate: number;
  currency: string;
  invoicePrefix: string;
  quotationPrefix: string;
  defaultPaymentTerms: number;
  defaultDueDays: number;
};

type SettingsContextType = {
  settings: Settings | null;
  loading: boolean;
};

const defaultSettings: Settings = {
  companyName: "",
  companyEmail: "",
  companyPhone: "",
  companyAddress: "",
  gst: "",
  website: "",
  mobile: "",
  logo: null,
  taxRate: 0,
  currency: "USD",
  invoicePrefix: "INV-",
  quotationPrefix: "QTN-",
  defaultPaymentTerms: 30,
  defaultDueDays: 30,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings({ ...defaultSettings, ...data });
        if (data.currency) setDefaultCurrency(data.currency);
      })
      .catch(() => setSettings(defaultSettings))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
