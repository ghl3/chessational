"use client";

import OpeningTree from "@/components/OpeningTree";
import { useAppContext } from "@/context/AppContext";
import { useMemo } from "react";

const TreePage = () => {
  const { studyData, chessboardState } = useAppContext();

  const chapters = useMemo(() => studyData.chapters || [], [studyData.chapters]);

  return (
    <OpeningTree
      chapters={chapters}
      onNodeSelect={(position) => {
        chessboardState.setNextPosition(position, true);
      }}
    />
  );
};

export default TreePage;
