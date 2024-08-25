import { ChessboardState } from "@/hooks/UseChessboardState";
import { EngineData } from "@/hooks/UseEngineData";
import { ReviewState } from "@/hooks/UseReviewState";
import { StudyData } from "@/hooks/UseStudyData";
import React from "react";
import { DetailsPanel } from "./DetailsPanel";
import { Mode } from "./NavBar";
import { ReviewLine } from "./ReviewLine";

export interface ReviewOrExploreLineProps {
  mode: Mode;
  chessboardState: ChessboardState;
  studyData: StudyData;
  //currentLineData: CurrentLineData;
  engineData: EngineData;
  reviewState: ReviewState;
  height: number;
}

export const ReviewOrExploreLine: React.FC<ReviewOrExploreLineProps> = ({
  mode,
  chessboardState,
  studyData,
  //currentLineData,
  engineData,
  reviewState,
  height,
}) => {
  const position = chessboardState.getPosition();

  const width = Math.floor(0.5 * height);

  return (
    <div
      style={{
        height: height ? `${height}px` : "auto",
        minWidth: `${width}px`,
      }}
    >
      {mode === "REVIEW" && studyData.selectedStudy != null && (
        <ReviewLine
          chessboardState={chessboardState}
          studyData={studyData}
          //currentLineData={currentLineData}
          reviewState={reviewState}
        />
      )}

      <DetailsPanel
        chapter={reviewState.lineAndChapter?.chapter || undefined}
        position={position || undefined}
        gameMoves={chessboardState.getGameMoves()}
        engineData={engineData}
      />
    </div>
  );
};
