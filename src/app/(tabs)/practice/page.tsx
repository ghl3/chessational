"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { SubTabPanel, SubTab } from "@/components/SubTabPanel";
import { Review } from "@/components/Review";
import { Attempts } from "@/components/Attempts";
import { LineStats } from "@/components/LineStats";
import { StudyChapterSelector } from "@/components/StudyChapterSelector";

const PracticePage: React.FC = () => {
  const { chessboardState, studyData, engineData, reviewState } = useAppContext();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<string>("quiz");

  const navigateToStudies = useCallback(() => {
    router.push("/studies");
  }, [router]);

  // Memoize to ensure stable references when data is undefined
  const lines = useMemo(() => studyData.selectedChapterLines ?? [], [studyData.selectedChapterLines]);
  const chapters = useMemo(() => studyData.selectedStudyChapters ?? [], [studyData.selectedStudyChapters]);
  const attempts = useMemo(() => studyData.selectedChapterAttempts ?? [], [studyData.selectedChapterAttempts]);

  const tabs: SubTab[] = useMemo(
    () => [
      {
        id: "quiz",
        label: "Quiz",
        content: (
          <div className="flex flex-col gap-3">
            <StudyChapterSelector studyData={studyData} />
            <Review
              chessboardState={chessboardState}
              studyData={studyData}
              engineData={engineData}
              reviewState={reviewState}
              onNavigateToStudies={navigateToStudies}
            />
          </div>
        ),
      },
      {
        id: "history",
        label: "History",
        badge: attempts.length > 0 ? attempts.length : undefined,
        badgeColor: "bg-gray-600",
        content: (
          <div className="flex flex-col gap-3 h-full min-h-0">
            <StudyChapterSelector studyData={studyData} />
            <Attempts
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
        id: "stats",
        label: "Stats",
        badge: lines.length > 0 ? lines.length : undefined,
        badgeColor: "bg-blue-600",
        content: (
          <div className="flex flex-col gap-3 h-full min-h-0">
            <StudyChapterSelector studyData={studyData} />
            <LineStats
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
    ],
    [
      chessboardState,
      studyData,
      engineData,
      reviewState,
      navigateToStudies,
      lines,
      chapters,
      attempts,
    ]
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <SubTabPanel
        tabs={tabs}
        initialTab={currentTab}
        onTabChange={setCurrentTab}
      />
    </div>
  );
};

export default PracticePage;

