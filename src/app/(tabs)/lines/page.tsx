"use client";

import Lines from "@/components/Lines";
import { useAppContext } from "@/context/AppContext";
import { useMemo } from "react";

const LinesPage = () => {
  const { studyData, chessboardState, engineData, reviewState } = useAppContext();

  const lines = useMemo(() => studyData.lines || [], [studyData.lines]);
  const chapters = useMemo(() => studyData.chapters || [], [studyData.chapters]);
  const attempts = useMemo(() => studyData.attempts || [], [studyData.attempts]);

  return (
    <Lines
      lines={lines}
      chapters={chapters}
      attempts={attempts}
      chessboardState={chessboardState}
      engineData={engineData}
      reviewState={reviewState}
    />
  );
};

export default LinesPage;
