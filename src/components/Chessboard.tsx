import { PieceCount, getPieceCounts } from "@/chess/Fen";
import { convertToPieceSymbol, getPromoteToPiece } from "@/chess/Move";
import { Position } from "@/chess/Position";
import useArrowKeys from "@/hooks/UseArrowKeys";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { BLACK, DEFAULT_POSITION, PieceSymbol, Square, WHITE } from "chess.js";
import React, { HTMLAttributes, useCallback, useMemo } from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";
import type { Arrow as RCArrow, PieceDropHandlerArgs } from "react-chessboard";
import ChessboardButtons from "./ChessboardButtons";
import { MaterialDiff } from "./MaterialDiff";

export interface Arrow {
  from: Square;
  to: Square;
  color?: string;
}

export type MoveExecutor = (
  newPosition: Position,
  sourceSquare: Square,
  targetSquare: Square,
  promoteToPiece?: PieceSymbol,
) => boolean;

interface ChessboardProps extends HTMLAttributes<HTMLDivElement> {
  chessboardSize: number;
  chessboardState: ChessboardState;
  onLegalMove: MoveExecutor;
}

const Chessboard: React.FC<ChessboardProps> = ({
  chessboardSize,
  chessboardState,
  onLegalMove,
}) => {
  const handleFlipBoard = useCallback(() => {
    chessboardState.setOrientation((prevOrientation) =>
      prevOrientation === WHITE ? BLACK : WHITE,
    );
  }, [chessboardState]);

  const handleLeftClick = useCallback(() => {
    if (chessboardState.currentPositionIndex <= 0) {
      return;
    }
    chessboardState.setPositionFromIndex(
      chessboardState.currentPositionIndex - 1,
    );
  }, [chessboardState]);

  const handleRightClick = useCallback(() => {
    if (
      chessboardState.currentPositionIndex + 1 ===
      chessboardState.positions.length
    ) {
      return;
    }
    chessboardState.setPositionFromIndex(
      chessboardState.currentPositionIndex + 1,
    );
  }, [chessboardState]);

  const handleJumpToStart = useCallback(() => {
    chessboardState.setPositionFromIndex(0);
  }, [chessboardState]);

  const handleJumpToEnd = useCallback(() => {
    if (chessboardState.positions.length === 0) {
      chessboardState.setPositionFromIndex(0);
    } else {
      const endIndex = chessboardState.positions.length - 1;
      chessboardState.setPositionFromIndex(endIndex);
    }
  }, [chessboardState]);

  useArrowKeys({
    onLeftArrow: handleLeftClick,
    onRightArrow: handleRightClick,
  });

  const fen = chessboardState.getCurrentFen() || DEFAULT_POSITION;

  const pieceCount: PieceCount = getPieceCounts(fen);

  // Convert arrows to react-chessboard v5 format
  const convertedArrows: RCArrow[] = useMemo(() => {
    if (!chessboardState.arrows) return [];
    return chessboardState.arrows.map((arrow) => ({
      startSquare: arrow.from,
      endSquare: arrow.to,
      color: arrow.color || "rgb(0, 128, 0)",
    }));
  }, [chessboardState.arrows]);

  const onPieceDrop = useCallback(
    ({ piece, sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
      if (targetSquare === null) {
        return false;
      }

      const originalPiece: PieceSymbol | null =
        chessboardState.getPieceAtSquare(sourceSquare as Square);
      if (originalPiece === null) {
        console.error("originalPiece is null for square:", sourceSquare);
        return false;
      }

      const promoteToPiece = getPromoteToPiece(
        sourceSquare as Square,
        targetSquare as Square,
        originalPiece,
        convertToPieceSymbol(piece.pieceType),
      );

      const moveAndPosition = chessboardState.createMoveOrNull(
        sourceSquare as Square,
        targetSquare as Square,
        promoteToPiece,
      );

      if (moveAndPosition === null) {
        return false;
      }

      const [_, newPosition] = moveAndPosition;

      // If we've gotten here, then the move is legal.
      // We now call the onLegalMove callback to handle the move
      // (which will likely update the board state).
      return onLegalMove(
        newPosition,
        sourceSquare as Square,
        targetSquare as Square,
        promoteToPiece,
      );
    },
    [chessboardState, onLegalMove],
  );

  // Compute board orientation string
  const boardOrientation: "white" | "black" =
    chessboardState.orientation === WHITE ? "white" : "black";

  return (
    <div
      className="flex flex-col items-center gap-3"
      style={{ width: `${chessboardSize}px` }}
    >
      <MaterialDiff
        pieceCount={pieceCount}
        color={chessboardState.orientation === WHITE ? BLACK : WHITE}
        className="h-6"
      />
      <div style={{ width: chessboardSize, height: chessboardSize }}>
        <ReactChessboard
          options={{
            position: fen,
            boardOrientation: boardOrientation,
            darkSquareStyle: { backgroundColor: "#34495e" },
            allowDrawingArrows: true,
            arrows: convertedArrows,
            onPieceDrop: onPieceDrop,
          }}
        />
      </div>
      <MaterialDiff
        pieceCount={pieceCount}
        color={chessboardState.orientation === WHITE ? WHITE : BLACK}
        className="h-6"
      />
      <ChessboardButtons
        isDisabled={false}
        handleJumpToStart={handleJumpToStart}
        handleLeftClick={handleLeftClick}
        handleRightClick={handleRightClick}
        handleJumpToEnd={handleJumpToEnd}
        handleFlipBoard={handleFlipBoard}
      />
    </div>
  );
};

export default Chessboard;
