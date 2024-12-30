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
  engineData: EngineData;
  reviewState: ReviewState;
}

export const ReviewOrExploreLine: React.FC<ReviewOrExploreLineProps> = ({
  mode,
  chessboardState,
  studyData,
  engineData,
  reviewState,
}) => {
  const position = chessboardState.getPosition();

  return (
    <div>
      {mode === "REVIEW" && studyData.selectedStudy != null && (
        <ReviewLine
          chessboardState={chessboardState}
          studyData={studyData}
          reviewState={reviewState}
        />
      )}

      <DetailsPanel
        chapter={reviewState.lineAndChapter?.chapter || undefined}
        currentPosition={position || undefined}
        positions={chessboardState.positions}
        engineData={engineData}
      />
    </div>
  );
};
