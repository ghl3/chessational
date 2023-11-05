import React, { HTMLAttributes, useCallback, useState } from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";
import { Square } from "react-chessboard/dist/chessboard/types";
import useArrowKeys from "@/hooks/UseArrowKeys";
import { ChessboardState } from "@/hooks/UseChessboardState";
import ChessboardButtons from "./ChessboardButtons";
import { PieceCount, getPieceCounts } from "@/chess/Fen";
import { PieceSymbol, WHITE, BLACK, DEFAULT_POSITION } from "chess.js";
import { MaterialDiff } from "./MaterialDiff";

interface ChessboardProps extends HTMLAttributes<HTMLDivElement> {
  chessboardState: ChessboardState;
  onPieceDrop: (source: Square, target: Square, piece: string) => boolean;
}

const Chessboard: React.FC<ChessboardProps> = ({
  chessboardState,
  onPieceDrop,
}) => {
  const setGamePositionFromIndex = useCallback(
    (moveIndex: number) => {
      chessboardState.setPositionFromIndex(moveIndex);
    },
    [chessboardState]
  );

  const handleFlipBoard = useCallback(() => {
    chessboardState.setOrientation((prevOrientation) =>
      prevOrientation === WHITE ? BLACK : WHITE
    );
  }, []);

  const handleLeftClick = useCallback(() => {
    if (chessboardState.positionIndex <= 0) {
      return;
    }
    setGamePositionFromIndex(chessboardState.positionIndex - 1);
  }, [chessboardState.positionIndex, setGamePositionFromIndex]);

  const handleRightClick = useCallback(() => {
    if (chessboardState.positionIndex + 1 == chessboardState.positions.length) {
      return;
    }
    setGamePositionFromIndex(chessboardState.positionIndex + 1);
  }, [
    chessboardState.positionIndex,
    chessboardState.positions,
    setGamePositionFromIndex,
  ]);

  const handleJumpToStart = useCallback(() => {
    setGamePositionFromIndex(0);
  }, [setGamePositionFromIndex]);

  const handleJumpToEnd = useCallback(() => {
    if (chessboardState.positions.length === 0) {
      setGamePositionFromIndex(0);
    } else {
      const endIndex = chessboardState.positions.length - 1;
      setGamePositionFromIndex(endIndex);
    }
  }, [chessboardState.positions, setGamePositionFromIndex]);

  // Inside your Review component
  useArrowKeys({
    onLeftArrow: handleLeftClick,
    onRightArrow: handleRightClick,
  });

  const fen =
    (chessboardState.positions.length > 0 &&
      chessboardState.positions[chessboardState.positionIndex].fen) ||
    DEFAULT_POSITION;

  const pieceCount: PieceCount = getPieceCounts(fen);

  const arrows = [
    ["e2", "e4"],
    ["e7", "e5"],
    ["g1", "f3"],
    ["b8", "c6"],
  ];

  const onPromotionCheck = (
    sourceSquare: Square,
    targetSquare: Square,
    piece: string
  ) => {
    const isPromotion =
      ((piece === "wP" && sourceSquare[1] === "7" && targetSquare[1] === "8") ||
        (piece === "bP" &&
          sourceSquare[1] === "2" &&
          targetSquare[1] === "1")) &&
      Math.abs(sourceSquare.charCodeAt(0) - targetSquare.charCodeAt(0)) <= 1;

    return isPromotion;
  };

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
          boardWidth={chessboardState.boardSize}
          areArrowsAllowed={true}
          boardOrientation={
            chessboardState.orientation == WHITE ? "white" : "black"
          }
          onPieceDrop={onPieceDrop}
          customArrows={arrows} //chessboardState.arrows}
          customArrowColor="rgb(0, 128, 0)"
          //autoPromoteToQueen={true}

          // TODO: Handle promotion
          //          onPromotionCheck
          //showPromotionDialog={true}
          promotionDialogVariant="default"
          //onPromotionPieceSelect={onPromotionPieceSelect}
          onPromotionCheck={onPromotionCheck}
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
