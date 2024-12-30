import { PieceCount, getPieceCounts } from "@/chess/Fen";
import { Move, convertToPieceSymbol, getPromoteToPiece } from "@/chess/Move";
import { Position } from "@/chess/Position";
import useArrowKeys from "@/hooks/UseArrowKeys";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { BLACK, DEFAULT_POSITION, PieceSymbol, WHITE } from "chess.js";
import React, { HTMLAttributes, useCallback, useState } from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";
import { Square } from "react-chessboard/dist/chessboard/types";
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
    if (chessboardState.getPositionIndex() <= 0) {
      return;
    }
    chessboardState.setPositionFromIndex(
      chessboardState.getPositionIndex() - 1,
    );
  }, [chessboardState]);

  const handleRightClick = useCallback(() => {
    if (
      chessboardState.getPositionIndex() + 1 ==
      chessboardState.positions.length
    ) {
      return;
    }
    chessboardState.setPositionFromIndex(
      chessboardState.getPositionIndex() + 1,
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

  // Inside your Review component
  useArrowKeys({
    onLeftArrow: handleLeftClick,
    onRightArrow: handleRightClick,
  });

  const fen = chessboardState.getFen() || DEFAULT_POSITION;

  const pieceCount: PieceCount = getPieceCounts(fen);

  const convertedArrows =
    chessboardState.arrows &&
    chessboardState.arrows.map((arrow) => {
      return [arrow.from, arrow.to, arrow?.color];
    });

  const onPieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square, piece: string): boolean => {
      const originalPiece: PieceSymbol | null =
        chessboardState.getPieceAtSquare(sourceSquare);
      if (originalPiece == null) {
        throw new Error("originalPiece is null");
      }

      const promoteToPiece = getPromoteToPiece(
        sourceSquare,
        targetSquare,
        originalPiece,
        convertToPieceSymbol(piece),
      );

      const [move, newPosition]: [Move | null, Position | null] =
        chessboardState.createMoveOrNull(
          sourceSquare,
          targetSquare,
          promoteToPiece,
        ) || [null, null];

      if (move == null || newPosition == null) {
        return false;
      }

      // If we've gotten here, then the move is legal.
      // We now call the onLegalMove callback to handle the move
      // (which will likely update the board state).
      return onLegalMove(
        newPosition,
        sourceSquare,
        targetSquare,
        promoteToPiece,
      );
    },
    [chessboardState, onLegalMove],
  );

  return (
    <>
      <div
        className="flex flex-col items-center space-y-1"
        style={{ width: `${chessboardSize}px`, height: "auto" }} // Dynamic size based on state
      >
        <MaterialDiff
          pieceCount={pieceCount}
          color={chessboardState.orientation == WHITE ? BLACK : WHITE}
        />
        <ReactChessboard
          position={fen}
          customDarkSquareStyle={{ backgroundColor: "#34495e" }}
          boardWidth={chessboardSize}
          areArrowsAllowed={true}
          boardOrientation={
            chessboardState.orientation == WHITE ? "white" : "black"
          }
          onPieceDrop={onPieceDrop}
          customArrows={convertedArrows}
          customArrowColor="rgb(0, 128, 0)"
          promotionDialogVariant="default"
        />
        <MaterialDiff
          pieceCount={pieceCount}
          color={chessboardState.orientation == WHITE ? WHITE : BLACK}
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
    </>
  );
};

export default Chessboard;
