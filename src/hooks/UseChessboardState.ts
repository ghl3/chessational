import { useState, useEffect } from "react";
import { Square } from "react-chessboard/dist/chessboard/types";
import { Color, WHITE } from "chess.js";
import { Position } from "@/chess/Position";

export interface Arrow {
  from: Square;
  to: Square;
  color?: string;
}

// A Chessboard can be thought of as a series of moves and
// positions as well as an orientation and board size.
export interface ChessboardState {
  positionIndex: number;
  //position: Fen;
  arrows: Arrow[];
  positions: Position[];
  boardSize: number;
  orientation: Color;

  setPositionFromIndex: (moveIndex: number) => void;
  setOrientation: React.Dispatch<React.SetStateAction<Color>>;
  setArrows: React.Dispatch<React.SetStateAction<Arrow[]>>;
  setNextPosition: (position: Position, overwrite: boolean) => void;
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
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionIndex, setPositionIndex] = useState<number>(-1);
  //const [position, setPosition] = useState<Fen>(DEFAULT_FEN);
  const [orientation, setOrientation] = useState<Color>(WHITE);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const boardSize = useBoardSize();

  const setPositionFromIndex = (moveIndex: number) => {
    if (moveIndex < positions.length) {
      setPositionIndex(moveIndex);
    }
  };

  const clearGame = () => {
    setPositions([]);
    setPositionIndex(-1);
  };

  const setNextPosition = (
    position: Position,
    overwriteLine: boolean = false
  ) => {
    if (positionIndex === positions.length - 1) {
      // If we are at the end of the line and we move, we just add it to the set of moves
      setPositions((positions) => [...positions, position]);
      setPositionIndex((positionIndex) => positionIndex + 1);
      //setPosition(move.fen);
    } else if (overwriteLine) {
      // If we are not at the end of the line and we move, we overwrite the line
      // with the new move and all subsequent moves
      setPositions((positions) =>
        positions.slice(0, positionIndex + 1).concat(position)
      );
      setPositionIndex((positionIndex) => positionIndex + 1);
      //setPosition(move.fen);
    } else {
      throw new Error(
        "Cannot move from a previous position or this will overwrite the line"
      );
    }
  };

  return {
    positionIndex: positionIndex,
    //position,
    arrows,
    positions,
    boardSize,
    orientation,

    setPositionFromIndex,
    setOrientation,
    setArrows,
    setNextPosition,
    clearGame,
  };
};
