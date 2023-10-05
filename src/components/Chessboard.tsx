import React, { HTMLAttributes, useCallback, useState } from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";
import { Square } from "react-chessboard/dist/chessboard/types";
import useArrowKeys from "@/hooks/UseArrowKeys";
import { ChessboardState } from "@/hooks/UseChessboardState";
import ChessboardButtons from "./ChessboardButtons";

interface ChessboardProps extends HTMLAttributes<HTMLDivElement> {
  chessboardState: ChessboardState;
  onPieceDrop: (source: Square, target: Square) => boolean;
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
      prevOrientation === "white" ? "black" : "white"
    );
  }, []);

  const handleLeftClick = useCallback(() => {
    if (chessboardState.moveIndex <= 0) {
      return;
    }
    setGamePositionFromIndex(chessboardState.moveIndex - 1);
  }, [chessboardState.moveIndex, setGamePositionFromIndex]);

  const handleRightClick = useCallback(() => {
    if (chessboardState.moveIndex + 1 == chessboardState.moves.length) {
      return;
    }
    setGamePositionFromIndex(chessboardState.moveIndex + 1);
  }, [
    chessboardState.moveIndex,
    chessboardState.moves,
    setGamePositionFromIndex,
  ]);

  const handleJumpToStart = useCallback(() => {
    setGamePositionFromIndex(0);
  }, [setGamePositionFromIndex]);

  const handleJumpToEnd = useCallback(() => {
    if (chessboardState.moves.length === 0) {
      setGamePositionFromIndex(0);
    } else {
      const endIndex = chessboardState.moves.length - 1;
      setGamePositionFromIndex(endIndex);
    }
  }, [chessboardState.moves, setGamePositionFromIndex]);

  // Inside your Review component
  useArrowKeys({
    onLeftArrow: handleLeftClick,
    onRightArrow: handleRightClick,
  });

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        <div>
          <ReactChessboard
            position={chessboardState.position}
            customDarkSquareStyle={{ backgroundColor: "#34495e" }}
            boardWidth={chessboardState.boardSize}
            areArrowsAllowed={true}
            boardOrientation={chessboardState.orientation}
            onPieceDrop={onPieceDrop}
            customArrows={chessboardState.arrows}
          />
        </div>

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
