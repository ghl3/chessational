"use client";

import React, { useState, ReactNode } from "react";

export type PanelView = "moves" | "deviations" | "gaps";

interface FlippablePanelProps {
  movesContent: ReactNode;
  deviationsContent: ReactNode;
  gapsContent: ReactNode;
  deviationsCount?: number;
  gapsCount?: number;
  initialView?: PanelView;
  onViewChange?: (view: PanelView) => void;
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
}> = ({ label, isActive, onClick, badge, badgeColor = "bg-red-500" }) => {
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
 * A panel that can flip between three views: move statistics, deviations, and gaps
 */
export const FlippablePanel: React.FC<FlippablePanelProps> = ({
  movesContent,
  deviationsContent,
  gapsContent,
  deviationsCount,
  gapsCount,
  initialView = "moves",
  onViewChange,
}) => {
  const [currentView, setCurrentView] = useState<PanelView>(initialView);

  const handleViewChange = (view: PanelView) => {
    setCurrentView(view);
    onViewChange?.(view);
  };

  const getContent = () => {
    switch (currentView) {
      case "moves":
        return movesContent;
      case "deviations":
        return deviationsContent;
      case "gaps":
        return gapsContent;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab headers */}
      <div className="flex gap-1 px-2 bg-gray-900/50">
        <TabButton
          label="Moves"
          isActive={currentView === "moves"}
          onClick={() => handleViewChange("moves")}
        />
        <TabButton
          label="Deviations"
          isActive={currentView === "deviations"}
          onClick={() => handleViewChange("deviations")}
          badge={deviationsCount}
          badgeColor="bg-red-500"
        />
        <TabButton
          label="Gaps"
          isActive={currentView === "gaps"}
          onClick={() => handleViewChange("gaps")}
          badge={gapsCount}
          badgeColor="bg-amber-500"
        />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto bg-gray-800/30 rounded-b-lg p-3">
        {getContent()}
      </div>
    </div>
  );
};

export default FlippablePanel;
