"use client";

import React from "react";
import { cn } from "@/lib/cn";

interface NavbarProps {
  title: string;
  companyName?: string;
  className?: string;
  children?: React.ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({
  title,
  companyName,
  className,
  children,
}) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          {children}
          {companyName && (
            <span className="text-sm text-gray-500">{companyName}</span>
          )}
        </div>
      </div>
    </header>
  );
};

Navbar.displayName = "Navbar";

export { Navbar };
export type { NavbarProps };
