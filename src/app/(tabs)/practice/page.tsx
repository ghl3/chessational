"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { SubTabPanel, SubTab } from "@/components/SubTabPanel";
import { Review } from "@/components/Review";
import { Attempts } from "@/components/Attempts";
import { StudyChapterSelector } from "@/components/StudyChapterSelector";

const PracticePage: React.FC = () => {
  const { chessboardState, studyData, engineData, reviewState } = useAppContext();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<string>("quiz");

  const navigateToStudies = useCallback(() => {
    router.push("/repertoire");
  }, [router]);

  // Memoize data for Attempts component
  const lines = useMemo(() => studyData.lines || [], [studyData.lines]);
  const chapters = useMemo(() => studyData.chapters || [], [studyData.chapters]);
  const attempts = useMemo(() => studyData.attempts || [], [studyData.attempts]);

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
          <div className="flex flex-col gap-3 h-full">
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

