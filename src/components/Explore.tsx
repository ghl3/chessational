import { ChessboardState } from "@/hooks/UseChessboardState";
import { CurrentLineData } from "@/hooks/UseCurrentLineData";
import { useStudyData } from "@/hooks/UseStudyData";
import React from "react";
import { StudyChapterSelector } from "./StudyChapterSelector";

export interface ExploreProps {
  chessboardState: ChessboardState;
  currentLineData: CurrentLineData;
  height?: number;
}

export const Explore: React.FC<ExploreProps> = ({}) => {
  const studyData = useStudyData();

  return (
    <div>
      <StudyChapterSelector studyData={studyData} />
    </div>
  );
};
