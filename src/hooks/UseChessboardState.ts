import { useState, useEffect, useRef } from "react";
import { Square } from "react-chessboard/dist/chessboard/types";
import { Position, createPosition, getGameResult } from "@/chess/Position";
import { Chess, Move as MoveResult, Color, WHITE } from "chess.js";
import { Fen } from "@/chess/Fen";
import { Move, moveResultToMove } from "@/chess/Move";

export interface Arrow {
  from: Square;
  to: Square;
  color?: string;
}

// A Chessboard can be thought of as a series of moves and
// positions as well as an orientation and board size.
export interface ChessboardState {
  positions: Position[];
  positionIndex: number;

  arrows: Arrow[];
  boardSize: number;
  orientation: Color;

  setPositionFromIndex: (moveIndex: number) => void;
  setOrientation: React.Dispatch<React.SetStateAction<Color>>;
  setArrows: React.Dispatch<React.SetStateAction<Arrow[]>>;
  setNextPosition: (position: Position, overwrite: boolean) => void;
  getPosition: () => Position;
  getFen: () => Fen;
  clearGame: () => void;
  createMoveOrNull: (
    sourceSquare: Square,
    targetSquare: Square
  ) => [Move, Position] | null;
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

  const [orientation, setOrientation] = useState<Color>(WHITE);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const boardSize = useBoardSize();

  let gameObject = useRef<Chess>(new Chess());

  const getPosition: () => Position = () => {
    if (positionIndex < 0) {
      throw new Error("Position index is negative");
    } else if (positionIndex >= positions.length) {
      throw new Error("Position index is too large");
    } else {
      return positions[positionIndex];
    }
  };

  const getFen: () => Fen = () => {
    return getPosition().fen;
  };

  const setPositionFromIndex = (moveIndex: number) => {
    if (moveIndex < positions.length) {
      setPositionIndex(moveIndex);
    }
  };

  const clearGame = () => {
    gameObject.current = new Chess();
    setPositions([]);
    setPositionIndex(-1);
  };

  const setNextPosition = (
    position: Position,
    overwriteLine: boolean = false
  ) => {
    gameObject.current.load(position.fen);

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

  // This does NOT update the chess object.
  // TODO: Handle promotion
  const createMoveOrNull = (
    sourceSquare: Square,
    targetSquare: Square
  ): [Move, Position] | null => {
    try {
      const moveResult: MoveResult = gameObject.current.move({
        from: sourceSquare,
        to: targetSquare,
      });

      if (moveResult == null) {
        return null;
      } else {
        const move: Move = moveResultToMove(moveResult);

        const position: Position = createPosition(move, gameObject.current);

        gameObject.current.undo();
        return [move, position];
      }
    } catch (error) {
      console.log("Invalid Move:", error);
      return null;
    }
  };

  return {
    positions,
    positionIndex,

    arrows,
    boardSize,
    orientation,

    setPositionFromIndex,
    setOrientation,
    setArrows,
    setNextPosition,
    getPosition,
    getFen,
    clearGame,
    createMoveOrNull,
  };
};
