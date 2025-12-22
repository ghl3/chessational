"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import { SubTabPanel, SubTab } from "@/components/SubTabPanel";
import { Studies } from "@/components/Studies";
import Lines from "@/components/Lines";
import OpeningTree from "@/components/OpeningTree";

const RepertoirePage: React.FC = () => {
  const { chessboardState, studyData, engineData, reviewState } = useAppContext();
  const [currentTab, setCurrentTab] = useState<string>("manage");

  // Memoize data for Lines component
  const lines = useMemo(() => studyData.lines || [], [studyData.lines]);
  const chapters = useMemo(() => studyData.chapters || [], [studyData.chapters]);
  const attempts = useMemo(() => studyData.attempts || [], [studyData.attempts]);

  // Count lines for badge
  const linesCount = lines.length;

  // Handle tree node selection
  const handleTreeNodeSelect = useCallback(
    (position: Parameters<typeof chessboardState.setNextPosition>[0]) => {
      chessboardState.setNextPosition(position, true);
    },
    [chessboardState]
  );

  const tabs: SubTab[] = useMemo(
    () => [
      {
        id: "manage",
        label: "Manage",
        content: <Studies studyData={studyData} />,
      },
      {
        id: "browse",
        label: "Browse",
        badge: linesCount > 0 ? linesCount : undefined,
        badgeColor: "bg-blue-600",
        content: (
          <Lines
            lines={lines}
            chapters={chapters}
            attempts={attempts}
            chessboardState={chessboardState}
            engineData={engineData}
            reviewState={reviewState}
          />
        ),
      },
      {
        id: "tree",
        label: "Tree",
        content: (
          <OpeningTree
            chapters={chapters}
            onNodeSelect={handleTreeNodeSelect}
          />
        ),
      },
    ],
    [studyData, lines, chapters, attempts, chessboardState, engineData, reviewState, linesCount, handleTreeNodeSelect]
  );

  return (
    <div className="h-full flex flex-col">
      <SubTabPanel
        tabs={tabs}
        initialTab={currentTab}
        onTabChange={setCurrentTab}
      />
    </div>
  );
};

export default RepertoirePage;

