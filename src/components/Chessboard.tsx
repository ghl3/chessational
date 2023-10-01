// components/Chessboard.tsx

import React, { HTMLAttributes, useCallback, useState } from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";

import { Square } from "react-chessboard/dist/chessboard/types";
//import styles from "../styles/Chessboard.module.css";
import useArrowKeys from "@/hooks/UseArrowKeys";
import { ChessboardState } from "@/hooks/UseChessboardState";
import ChessboardButtons from "./ChessboardButtons";

interface ChessboardProps extends HTMLAttributes<HTMLDivElement> {
  chessboardState: ChessboardState;
  onPieceDrop: (source: Square, target: Square) => boolean;
}

const Chessboard: React.FC<ChessboardProps> = ({
  chessboardState: chessboardData,
  onPieceDrop,
}) => {
  const setGamePositionFromIndex = useCallback(
    (moveIndex: number) => {
      chessboardData.setPositionFromIndex(moveIndex);
    },
    [chessboardData]
  );

  const handleFlipBoard = useCallback(() => {
    chessboardData.setOrientation((prevOrientation) =>
      prevOrientation === "white" ? "black" : "white"
    );
  }, []);

  const handleLeftClick = useCallback(() => {
    if (chessboardData.moveIndex <= 0) {
      return;
    }
    setGamePositionFromIndex(chessboardData.moveIndex - 1);
  }, [chessboardData.moveIndex, setGamePositionFromIndex]);

  const handleRightClick = useCallback(() => {
    if (chessboardData.moveIndex + 1 == chessboardData.moves.length) {
      return;
    }
    setGamePositionFromIndex(chessboardData.moveIndex + 1);
  }, [
    chessboardData.moveIndex,
    chessboardData.moves,
    setGamePositionFromIndex,
  ]);

  const handleJumpToStart = useCallback(() => {
    setGamePositionFromIndex(0);
  }, [setGamePositionFromIndex]);

  const handleJumpToEnd = useCallback(() => {
    if (chessboardData.moves.length === 0) {
      setGamePositionFromIndex(0);
    } else {
      const endIndex = chessboardData.moves.length - 1;
      setGamePositionFromIndex(endIndex);
    }
  }, [chessboardData.moves, setGamePositionFromIndex]);

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
            position={chessboardData.position}
            customDarkSquareStyle={{ backgroundColor: "#34495e" }}
            boardWidth={chessboardData.boardSize}
            areArrowsAllowed={true}
            boardOrientation={chessboardData.orientation}
            onPieceDrop={onPieceDrop}
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
