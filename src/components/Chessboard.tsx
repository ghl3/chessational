// components/Chessboard.tsx

import React, { useCallback, useState } from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";

import { Square } from "react-chessboard/dist/chessboard/types";
import styles from "../styles/Chessboard.module.css";
import useArrowKeys from "@/hooks/UseArrowKeys";
import { ChessboardState } from "@/hooks/UseChessboardState";

interface ChessboardProps {
  chessboardState: ChessboardState;
  onDrop: (source: Square, target: Square) => boolean;
}

interface GameControlButtonsProps {
  isDisabled: boolean;
  handleJumpToStart: () => void;
  handleLeftClick: () => void;
  handleRightClick: () => void;
  handleJumpToEnd: () => void;
  handleFlipBoard: () => void;
}

const GameControlButtons: React.FC<GameControlButtonsProps> = ({
  isDisabled,
  handleJumpToStart,
  handleLeftClick,
  handleRightClick,
  handleJumpToEnd,
  handleFlipBoard,
}) => (
  <div className={styles.buttonRow}>
    <button
      className={`${styles.localButton} ui small button`}
      onClick={handleJumpToStart}
      disabled={isDisabled}
    >
      &laquo;
    </button>
    <button
      className={`${styles.localButton} ui small button`}
      onClick={handleLeftClick}
      disabled={isDisabled}
    >
      &larr;
    </button>
    <button
      className={`${styles.localButton} ui small button`}
      onClick={handleRightClick}
      disabled={isDisabled}
    >
      &rarr;
    </button>
    <button
      className={`${styles.localButton} ui small button`}
      onClick={handleJumpToEnd}
      disabled={isDisabled}
    >
      &raquo;
    </button>
    <button
      className={`${styles.localButton} ui small button`}
      onClick={handleFlipBoard}
      disabled={isDisabled}
    >
      Flip Board
    </button>
  </div>
);

const Chessboard: React.FC<ChessboardProps> = ({
  chessboardState: chessboardData,
  onDrop,
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
      <div className={styles.container}>
        <div className={styles.Chessboard}>
          <ReactChessboard
            position={chessboardData.position}
            customDarkSquareStyle={{ backgroundColor: "#34495e" }}
            boardWidth={chessboardData.boardSize}
            areArrowsAllowed={true}
            boardOrientation={chessboardData.orientation}
            onPieceDrop={onDrop}
          />
        </div>

        <GameControlButtons
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
