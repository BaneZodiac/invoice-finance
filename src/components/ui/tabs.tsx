"use client";

import React, { useState } from "react";
import { cn } from "@/lib/cn";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  children?: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab: controlledActiveTab,
  onChange,
  className,
  children,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id || "");
  const isControlled = controlledActiveTab !== undefined;
  const activeTab = isControlled ? controlledActiveTab : internalActiveTab;

  const handleTabClick = (tabId: string) => {
    if (!isControlled) {
      setInternalActiveTab(tabId);
    }
    onChange?.(tabId);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="border-b border-gray-200" role="tablist">
        <div className="flex -mb-px space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
};

Tabs.displayName = "Tabs";

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

const TabPanel: React.FC<TabPanelProps> = ({ id, activeTab, children, className }) => {
  if (id !== activeTab) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      className={cn("pt-4", className)}
    >
      {children}
    </div>
  );
};

TabPanel.displayName = "TabPanel";

export { Tabs, TabPanel };
export type { TabsProps, TabPanelProps, Tab };
