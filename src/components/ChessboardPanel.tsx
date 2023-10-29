import { ChessboardState } from "@/hooks/UseChessboardState";
import Chessboard from "./Chessboard";
import { Move } from "@/chess/Move";
import { PositionEvaluation } from "@/components/PositionEvaluation";
import { Database } from "@/components/Database";
import { LineMoveResult, MoveDescription } from "@/components/MoveDescription";
import { PieceSymbol, Square } from "chess.js";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { Fen } from "@/chess/Fen";
import { LineStatus } from "@/chess/Line";
import { useEffect, useRef, useState } from "react";
import CommentArea from "./CommentArea";

export interface ChessboardPanelProps {
  chessboardState: ChessboardState;
  onPieceDrop: (
    sourceSquare: Square,
    targetSquare: Square,
    promotion: PieceSymbol | undefined
  ) => boolean;
  showEngine: boolean;
  positionEvaluation: EvaluatedPosition | null;
  showDatabase: boolean;
  moveResult: LineMoveResult | null;
  comments: string[];
  position: Fen;
  move: Move;
  lineStatus: LineStatus | undefined;
  showComments: boolean;
}

export const ChessboardPanel: React.FC<ChessboardPanelProps> = ({
  chessboardState,
  onPieceDrop,
  showEngine,
  positionEvaluation,
  showDatabase,
  moveResult,
  comments,
  position,
  move,
  lineStatus,
  showComments,
}) => {
  const chessboardRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (chessboardRef.current) {
      setHeight(chessboardRef.current.clientHeight);
    }
  }, [chessboardRef.current, chessboardState.boardSize]);

  return (
    <div className="flex flex-row justify-center items-start mb-6  w-screen">
      {/* Left Column */}
      <div ref={chessboardRef}>
        <Chessboard
          chessboardState={chessboardState}
          onPieceDrop={onPieceDrop}
          className="flex-none"
        />
      </div>

      {/* Right Column */}
      <div
        className="w-1/3 ml-6 space-y-6 bg-gray-800 "
        style={{ height: height ? `${height}px` : "auto" }}
      >
        <MoveDescription
          move={move}
          status={lineStatus}
          result={moveResult || undefined}
        />
        <CommentArea comments={comments} showComments={showComments} />

        <PositionEvaluation
          showEngine={showEngine}
          positionEvaluation={positionEvaluation || undefined}
        />
        <Database showDatabase={showDatabase} position={position} />
      </div>
    </div>
  );
};
