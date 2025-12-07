"use client";

import { Attempts } from "@/components/Attempts";
import { useAppContext } from "@/context/AppContext";
import { useMemo } from "react";

const AttemptsPage = () => {
  const { studyData, chessboardState } = useAppContext();

  const lines = useMemo(() => studyData.lines || [], [studyData.lines]);
  const chapters = useMemo(() => studyData.chapters || [], [studyData.chapters]);
  const attempts = useMemo(() => studyData.attempts || [], [studyData.attempts]);

  return (
    <Attempts
      lines={lines}
      chapters={chapters}
      attempts={attempts}
      chessboardState={chessboardState}
    />
  );
};

export default AttemptsPage;
