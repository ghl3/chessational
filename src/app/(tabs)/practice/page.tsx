"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { SubTabPanel, SubTab } from "@/components/SubTabPanel";
import { Review } from "@/components/Review";
import { Attempts } from "@/components/Attempts";

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
          <Review
            chessboardState={chessboardState}
            studyData={studyData}
            engineData={engineData}
            reviewState={reviewState}
            onNavigateToStudies={navigateToStudies}
          />
        ),
      },
      {
        id: "history",
        label: "History",
        badge: attempts.length > 0 ? attempts.length : undefined,
        badgeColor: "bg-gray-600",
        content: (
          <Attempts
            lines={lines}
            chapters={chapters}
            attempts={attempts}
            chessboardState={chessboardState}
            engineData={engineData}
            reviewState={reviewState}
          />
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

