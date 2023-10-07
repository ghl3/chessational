import { DEFAULT_FEN, Fen } from "@/chess/Fen";
import { Move } from "@/chess/Move";
import { useState, useEffect } from "react";
import { Square } from "react-chessboard/dist/chessboard/types";
import { Color, WHITE } from "chess.js";

export interface Arrow {
  from: Square;
  to: Square;
  color?: string;
}

// A Chessboard can be thought of as a series of moves and
// positions as well as an orientation and board size.
export interface ChessboardState {
  moveIndex: number;
  position: Fen;
  arrows: Arrow[];
  moves: Move[];
  boardSize: number;
  orientation: Color;

  setPositionFromIndex: (moveIndex: number) => void;
  setOrientation: React.Dispatch<React.SetStateAction<Color>>;
  setArrows: React.Dispatch<React.SetStateAction<Arrow[]>>;
  addMove: (move: Move) => void;
  clearGame: () => void;
}

const useBoardSize = (): number => {
  const [boardSize, setBoardSize] = useState<number>(400);

  useEffect(() => {
    const getViewportSizes = () => {
      const vw = Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0
      );
      const vh = Math.max(
        document.documentElement.clientHeight || 0,
        window.innerHeight || 0
      );
      return [vw, vh];
    };

    const resizeBoard = () => {
      const [vw, vh] = getViewportSizes();
      const frac = 3;
      const newBoardSize = Math.floor(Math.min(vw / frac, vh - 250) / 10) * 10;
      setBoardSize(newBoardSize);
    };

    resizeBoard();

    window.addEventListener("resize", resizeBoard);

    return () => {
      window.removeEventListener("resize", resizeBoard);
    };
  }, []);

  return boardSize;
};

export const useChessboardState = (): ChessboardState => {
  const [moves, setMoves] = useState<Move[]>([]);
  const [moveIndex, setMoveIndex] = useState<number>(0);
  const [position, setPosition] = useState<Fen>(DEFAULT_FEN);
  const [orientation, setOrientation] = useState<Color>(WHITE);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const boardSize = useBoardSize();

  const setPositionFromIndex = (moveIndex: number) => {
    if (moveIndex < moves.length) {
      setMoveIndex(moveIndex);
      setPosition(moves[moveIndex].fen);
    }
  };

  const clearGame = () => {
    setMoves([]);
    setMoveIndex(0);
    setPosition(DEFAULT_FEN);
  };

  const addMove = (move: Move) => {
    setMoves((moves) => [...moves, move]);
    setMoveIndex((moveIndex) => moveIndex + 1);
    setPosition(move.fen);
  };

  return {
    moveIndex,
    position,
    arrows,
    moves,
    boardSize,
    orientation,

    setPositionFromIndex,
    setOrientation,
    setArrows,
    addMove,
    clearGame,
  };
};
