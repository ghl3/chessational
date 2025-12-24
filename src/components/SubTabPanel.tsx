"use client";

import React, { ReactNode, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface SubTab {
  id: string;
  label: string;
  content: ReactNode;
  badge?: number;
  badgeColor?: string;
}

interface SubTabPanelProps {
  tabs: SubTab[];
  initialTab?: string;
  /** Optional header that appears above content in all tabs */
  header?: ReactNode;
}

/**
 * Tab button component
 */
const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
  badgeColor?: string;
}> = ({ label, isActive, onClick, badge, badgeColor = "bg-rose-500" }) => {
  return (
    <button
      className={`
        relative px-3 py-2 text-sm font-medium rounded-t-lg transition-colors
        ${
          isActive
            ? "bg-gray-800 text-white border-b-2 border-blue-500"
            : "bg-gray-900 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
        }
      `}
      onClick={onClick}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className={`
            absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
            flex items-center justify-center
            text-xs font-bold rounded-full text-white
            ${badgeColor}
          `}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
};

/**
 * A panel with sub-tabs that persists the active tab in the URL via query params.
 */
export const SubTabPanel: React.FC<SubTabPanelProps> = ({
  tabs,
  initialTab,
  header,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read current tab from URL, fall back to initialTab or first tab
  const defaultTab = initialTab || tabs[0]?.id || "";
  const currentTabId = searchParams.get("tab") || defaultTab;

  const handleTabChange = useCallback(
    (tabId: string) => {
      // Update URL with new tab
      const params = new URLSearchParams(searchParams.toString());
      if (tabId === defaultTab) {
        // Remove param if it's the default to keep URLs clean
        params.delete("tab");
      } else {
        params.set("tab", tabId);
      }
      const newUrl = params.toString() ? `${pathname}?${params}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, pathname, router, defaultTab]
  );

  const currentTab = tabs.find((tab) => tab.id === currentTabId) || tabs[0];

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab headers - pt-2 gives room for badge overflow */}
      <div className="flex gap-1 px-2 pt-2 bg-gray-900/50">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            label={tab.label}
            isActive={currentTabId === tab.id}
            onClick={() => handleTabChange(tab.id)}
            badge={tab.badge}
            badgeColor={tab.badgeColor}
          />
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-auto bg-gray-800/30 rounded-b-lg p-3 flex flex-col gap-3">
        {header}
        <div className="flex-1 min-h-0">
          {currentTab?.content}
        </div>
      </div>
    </div>
  );
};

export default SubTabPanel;
