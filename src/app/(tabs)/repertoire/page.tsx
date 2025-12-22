"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import { SubTabPanel, SubTab } from "@/components/SubTabPanel";
import { Studies } from "@/components/Studies";
import Lines from "@/components/Lines";
import OpeningTree from "@/components/OpeningTree";
import { StudyChapterSelector } from "@/components/StudyChapterSelector";

const RepertoirePage: React.FC = () => {
  const { chessboardState, studyData, engineData, reviewState } = useAppContext();
  const [currentTab, setCurrentTab] = useState<string>("manage");

  // Memoize to ensure stable references when data is undefined
  const lines = useMemo(() => studyData.selectedChapterLines ?? [], [studyData.selectedChapterLines]);
  const chapters = useMemo(() => studyData.selectedStudyChapters ?? [], [studyData.selectedStudyChapters]);
  const attempts = useMemo(() => studyData.selectedChapterAttempts ?? [], [studyData.selectedChapterAttempts]);

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
          <div className="flex flex-col gap-3 h-full">
            <StudyChapterSelector studyData={studyData} />
            <Lines
              lines={lines}
              chapters={chapters}
              attempts={attempts}
              chessboardState={chessboardState}
              engineData={engineData}
              reviewState={reviewState}
            />
          </div>
        ),
      },
      {
        id: "tree",
        label: "Tree",
        content: (
          <div className="flex flex-col gap-3 h-full">
            <StudyChapterSelector studyData={studyData} />
            <OpeningTree
              chapters={chapters}
              onNodeSelect={handleTreeNodeSelect}
            />
          </div>
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

