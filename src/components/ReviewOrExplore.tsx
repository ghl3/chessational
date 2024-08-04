import { ChessboardState } from "@/hooks/UseChessboardState";
import { CurrentLineData } from "@/hooks/UseCurrentLineData";
import { EngineData } from "@/hooks/UseEngineData";
import { ReviewState } from "@/hooks/UseReviewState";
import { StudyData } from "@/hooks/UseStudyData";
import React from "react";
import { DetailsPanel } from "./DetailsPanel";
import { MoveDescription } from "./MoveDescription";
import { Mode } from "./NavBar";
import { ReviewLine } from "./ReviewLine";
import { StudyChapterSelector } from "./StudyChapterSelector";

export interface ReviewOrExploreLineProps {
  mode: Mode;
  chessboardState: ChessboardState;
  studyData: StudyData;
  currentLineData: CurrentLineData;
  engineData: EngineData;
  reviewState: ReviewState;
  height?: number;
}

export const ReviewOrExploreLine: React.FC<ReviewOrExploreLineProps> = ({
  mode,
  chessboardState,
  studyData,
  currentLineData,
  engineData,
  reviewState,
  height,
}) => {
  const position = chessboardState.getPosition();

  return (
    <div>
      <StudyChapterSelector studyData={studyData} />

      {position && (
        <MoveDescription
          position={position}
          status={currentLineData.lineStatus}
          result={reviewState.lineMoveResult || undefined}
        />
      )}

      <DetailsPanel
        chapter={currentLineData.lineAndChapter?.chapter || undefined}
        position={position || undefined}
        gameMoves={chessboardState.getGameMoves()}
        engineData={engineData}
        height={height || 0}
      />

      {mode === "REVIEW" && studyData.selectedStudy != null ? (
        <ReviewLine
          chessboardState={chessboardState}
          studyData={studyData}
          currentLineData={currentLineData}
          reviewState={reviewState}
        />
      ) : null}
    </div>
  );
};
