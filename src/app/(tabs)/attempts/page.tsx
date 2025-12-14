"use client";

import { Attempts } from "@/components/Attempts";
import { useAppContext } from "@/context/AppContext";
import { useMemo } from "react";

const AttemptsPage = () => {
  const { studyData, chessboardState, engineData, reviewState } = useAppContext();

  const lines = useMemo(() => studyData.lines || [], [studyData.lines]);
  const chapters = useMemo(() => studyData.chapters || [], [studyData.chapters]);
  const attempts = useMemo(() => studyData.attempts || [], [studyData.attempts]);

  return (
    <Attempts
      lines={lines}
      chapters={chapters}
      attempts={attempts}
      chessboardState={chessboardState}
      engineData={engineData}
      reviewState={reviewState}
    />
  );
};

export default AttemptsPage;
