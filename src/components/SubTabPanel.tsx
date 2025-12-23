"use client";

import React, { useState, ReactNode } from "react";

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
  onTabChange?: (tabId: string) => void;
}

/**
 * Tab button component matching FlippablePanel style
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
 * A generalized panel with sub-tabs, styled like FlippablePanel.
 * Can be used for Practice (Quiz/History) and Repertoire (Manage/Browse) pages.
 */
export const SubTabPanel: React.FC<SubTabPanelProps> = ({
  tabs,
  initialTab,
  onTabChange,
}) => {
  const [currentTabId, setCurrentTabId] = useState<string>(
    initialTab || tabs[0]?.id || ""
  );

  const handleTabChange = (tabId: string) => {
    setCurrentTabId(tabId);
    onTabChange?.(tabId);
  };

  const currentTab = tabs.find((tab) => tab.id === currentTabId);

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

      {/* Content area - flex container for children to fill */}
      <div className="flex-1 min-h-0 flex flex-col bg-gray-800/30 rounded-b-lg p-3">
        {currentTab?.content}
      </div>
    </div>
  );
};

export default SubTabPanel;

