import { Fen, Move } from "@/chess/PgnTree";
import { useState, useEffect } from "react";

const defaultFen: Fen =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// A Chessboard can be thought of as a series of moves and
// positions as well as an orientation and board size.
export interface ChessboardState {
  moveIndex: number;
  position: Fen;
  moves: Move[];
  boardSize: number;
  orientation: "white" | "black";

  setPositionFromIndex: (moveIndex: number) => void;
  setOrientation: React.Dispatch<React.SetStateAction<"white" | "black">>;
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
  const [position, setPosition] = useState<Fen>(defaultFen);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
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
    setPosition(defaultFen);
  };

  const addMove = (move: Move) => {
    setMoves((moves) => [...moves, move]);
    setMoveIndex((moveIndex) => moveIndex + 1);
    setPosition(move.fen);
  };

  return {
    moveIndex,
    position,
    moves,
    boardSize,
    orientation,

    setPositionFromIndex,
    setOrientation,
    addMove,
    clearGame,
  };
};
