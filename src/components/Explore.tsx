import { ChessboardState } from "@/hooks/UseChessboardState";
import { useStudyData } from "@/hooks/UseStudyData";
import React, { MutableRefObject, useEffect } from "react";

import { CurrentLineData } from "@/hooks/UseCurrentLineData";
import { MoveValidator } from "./Chessboard";
import { StudyChapterSelector } from "./StudyChapterSelector";

export interface ExploreProps {
  chessboardState: ChessboardState;
  onValidPieceDropRef: MutableRefObject<MoveValidator | null>;
  currentLineData: CurrentLineData;
  height?: number;
}

export const Explore: React.FC<ExploreProps> = ({ onValidPieceDropRef }) => {
  const studyData = useStudyData();

  useEffect(() => {
    onValidPieceDropRef.current = (
      _newPosition,
      _sourceSquare,
      _targetSquare,
      _promoteToPiece,
    ) => {
      return true;
    };
    return () => {
      onValidPieceDropRef.current = null;
    };
  }, [onValidPieceDropRef]);

  return (
    <div>
      <StudyChapterSelector studyData={studyData} />
    </div>
  );
};
