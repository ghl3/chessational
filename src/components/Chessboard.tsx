import React, { HTMLAttributes, useCallback, useState } from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";
import { Square } from "react-chessboard/dist/chessboard/types";
import useArrowKeys from "@/hooks/UseArrowKeys";
import { ChessboardState } from "@/hooks/UseChessboardState";
import ChessboardButtons from "./ChessboardButtons";
import { PieceCount, getPieceCounts } from "@/chess/Fen";
import { WHITE, BLACK, DEFAULT_POSITION } from "chess.js";
import { MaterialDiff } from "./MaterialDiff";

export interface Arrow {
  from: Square;
  to: Square;
  color?: string;
}

interface ChessboardProps extends HTMLAttributes<HTMLDivElement> {
  chessboardSize: number;
  chessboardState: ChessboardState;
  onPieceDrop: (source: Square, target: Square, piece: string) => boolean;
  arrows?: Arrow[];
}

const Chessboard: React.FC<ChessboardProps> = ({
  chessboardSize,
  chessboardState,
  onPieceDrop,
  arrows,
}) => {
  const handleFlipBoard = useCallback(() => {
    chessboardState.setOrientation((prevOrientation) =>
      prevOrientation === WHITE ? BLACK : WHITE
    );
  }, []);

  const handleLeftClick = useCallback(() => {
    if (chessboardState.getPositionIndex() <= 0) {
      return;
    }
    chessboardState.setPositionFromIndex(
      chessboardState.getPositionIndex() - 1
    );
  }, [
    chessboardState.getPositionIndex(),
    chessboardState.setPositionFromIndex,
  ]);

  const handleRightClick = useCallback(() => {
    if (
      chessboardState.getPositionIndex() + 1 ==
      chessboardState.positions.length
    ) {
      return;
    }
    chessboardState.setPositionFromIndex(
      chessboardState.getPositionIndex() + 1
    );
  }, [
    chessboardState.positions,
    chessboardState.getPositionIndex(),
    chessboardState.setPositionFromIndex,
  ]);

  const handleJumpToStart = useCallback(() => {
    chessboardState.setPositionFromIndex(0);
  }, [chessboardState.setPositionFromIndex]);

  const handleJumpToEnd = useCallback(() => {
    if (chessboardState.positions.length === 0) {
      chessboardState.setPositionFromIndex(0);
    } else {
      const endIndex = chessboardState.positions.length - 1;
      chessboardState.setPositionFromIndex(endIndex);
    }
  }, [chessboardState.positions, chessboardState.setPositionFromIndex]);

  // Inside your Review component
  useArrowKeys({
    onLeftArrow: handleLeftClick,
    onRightArrow: handleRightClick,
  });

  const fen = chessboardState.getFen() || DEFAULT_POSITION;

  const pieceCount: PieceCount = getPieceCounts(fen);

  const convertedArrows =
    arrows &&
    arrows.map((arrow) => {
      return [arrow.from, arrow.to, arrow?.color];
    });

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
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
