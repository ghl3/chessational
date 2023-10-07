import React, { HTMLAttributes, useCallback, useState } from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";
import { Square } from "react-chessboard/dist/chessboard/types";
import useArrowKeys from "@/hooks/UseArrowKeys";
import { ChessboardState } from "@/hooks/UseChessboardState";
import ChessboardButtons from "./ChessboardButtons";
import { PieceCount, getPieceCounts } from "@/chess/Fen";
import { PieceSymbol, Color, WHITE, BLACK } from "chess.js";

interface ChessboardProps extends HTMLAttributes<HTMLDivElement> {
  chessboardState: ChessboardState;
  onPieceDrop: (source: Square, target: Square) => boolean;
}

const pieceToUnicode = (piece: PieceSymbol, color: Color): string => {
  const pieceMap = {
    k: "♔",
    q: "♕",
    r: "♖",
    b: "♗",
    n: "♘",
    p: "♙",
  };

  const unicode = pieceMap[piece];
  return color === BLACK ? unicode.toLowerCase() : unicode;
};

const renderPieceDiff = (pieceCount: PieceCount, baseColor: Color) => {
  const diffs: Map<PieceSymbol, number> = new Map();
  const primary = baseColor === WHITE ? pieceCount.white : pieceCount.black;
  const opposite = baseColor === WHITE ? pieceCount.black : pieceCount.white;

  primary.forEach((count, piece) => {
    const diff = count - (opposite.get(piece) || 0);
    if (diff > 0) {
      diffs.set(piece, diff);
    }
  });

  return (
    <>
      {Array.from(diffs).map(([piece, num]) => (
        <span key={piece}>
          {Array.from({ length: Math.abs(num) }).map((_, i) => (
            <span key={i}>{pieceToUnicode(piece, baseColor)}</span>
          ))}
        </span>
      ))}
    </>
  );
};

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

  const pieceCount: PieceCount = getPieceCounts(chessboardState.position);

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        <div className="piece-diff">
          {renderPieceDiff(
            pieceCount,
            chessboardState.orientation == WHITE ? BLACK : WHITE
          )}
        </div>
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
        <div className="piece-diff">
          {renderPieceDiff(
            pieceCount,
            chessboardState.orientation == WHITE ? WHITE : BLACK
          )}
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
