import { ChessboardState } from "@/hooks/UseChessboardState";
import Chessboard from "./Chessboard";
import { Move } from "@/chess/Move";
import { PositionEvaluation } from "@/components/PositionEvaluation";
import { Database } from "@/components/Database";
import DescriptionArea from "@/components/DescriptionArea";
import { LineMoveResult } from "@/components/MoveDescription";
import { PieceSymbol, Square } from "chess.js";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { Fen } from "@/chess/Fen";
import { LineStatus } from "@/chess/Line";
import { useEffect, useRef, useState } from "react";

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
  const chessboardRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (chessboardRef.current) {
        const newHeight = (chessboardRef.current as HTMLElement).clientHeight;
        setHeight(newHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call it initially

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex flex-row justify-center items-start mb-6  max-w-screen-xl">
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
        className="flex flex-col ml-6 space-y-6 bg-gray-800 "
        style={{ height: `${height}px` }}
      >
        <PositionEvaluation
          showEngine={showEngine}
          positionEvaluation={positionEvaluation || undefined}
        />
        <Database showDatabase={showDatabase} position={position} />
        <div className="bg-gray-800 p-4 overflow-hidden whitespace-normal">
          <DescriptionArea
            move={move}
            moveResult={moveResult || undefined}
            lineStatus={lineStatus}
            comments={comments}
            showComments={showComments}
          />
        </div>
      </div>
    </div>
  );
};
