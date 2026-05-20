"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";

const publicPaths = ["/login", "/signup"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-auto min-w-0">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 mobile-only no-print">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-white">NF</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">Nomads Finance</span>
          </div>
        </div>
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
