import { useState, useRef, useCallback } from "react";
import { Square } from "react-chessboard/dist/chessboard/types";
import { Position, createPosition } from "@/chess/Position";
import { Chess, Move as MoveResult, Color, WHITE, PieceSymbol } from "chess.js";
import { Fen } from "@/chess/Fen";
import { Move, moveResultToMove } from "@/chess/Move";

// A Chessboard can be thought of as a series of moves and
// positions as well as an orientation and board size.
export interface ChessboardState {
  positions: Position[];
  positionIndex: number;
  orientation: Color;

  setPositionFromIndex: (moveIndex: number) => void;
  setOrientation: React.Dispatch<React.SetStateAction<Color>>;
  setNextPosition: (position: Position, overwrite: boolean) => void;
  getPosition: () => Position;
  getFen: () => Fen;
  clearGame: () => void;
  createMoveOrNull: (
    sourceSquare: Square,
    targetSquare: Square,
    promotion?: PieceSymbol
  ) => [Move, Position] | null;
  getPieceAtSquare: (square: Square) => PieceSymbol | null;
}

export const useChessboardState = (): ChessboardState => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionIndex, setPositionIndex] = useState<number>(-1);
  const [orientation, setOrientation] = useState<Color>(WHITE);

  let gameObject = useRef<Chess>(new Chess());

  const getPosition = useCallback((): Position => {
    if (positionIndex < 0) {
      throw new Error("Position index is negative");
    } else if (positionIndex >= positions.length) {
      throw new Error("Position index is too large");
    } else {
      return positions[positionIndex];
    }
  }, [positionIndex, positions]);

  const getFen = useCallback((): Fen => {
    return getPosition().fen;
  }, [getPosition]);

  const clearGame = () => {
    gameObject.current = new Chess();
    setPositions([]);
    setPositionIndex(-1);
  };

  // Return to an existing position in the history.
  const setPositionFromIndex = useCallback(
    (moveIndex: number) => {
      if (moveIndex < 0) {
        throw new Error("Position index is negative");
      } else if (moveIndex >= positions.length) {
        throw new Error("Position index is too large");
      } else {
        setPositionIndex(moveIndex);
        gameObject.current.load(positions[moveIndex].fen);
      }
    },
    [positionIndex, positions]
  );

  // Move to a new position, potentially creating a new history.
  const setNextPosition = useCallback(
    (position: Position, overwriteHistory: boolean = false) => {
      gameObject.current.load(position.fen);

      if (positionIndex === positions.length - 1) {
        // If we are at the end of the line and we move, we just add it to the set of moves
        setPositions((positions) => [...positions, position]);
        setPositionIndex((positionIndex) => positionIndex + 1);
        //setPosition(move.fen);
      } else if (overwriteHistory) {
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
    },
    [positionIndex, positions]
  );

  // This does NOT update the chess object.
  const createMoveOrNull = (
    sourceSquare: Square,
    targetSquare: Square,
    promotion?: PieceSymbol
  ): [Move, Position] | null => {
    try {
      const moveResult: MoveResult = gameObject.current.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: promotion,
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

  const getPieceAtSquare = (square: Square): PieceSymbol | null => {
    const piece = gameObject.current.get(square);
    return piece.type;
  };

  return {
    positions,
    positionIndex,
    orientation,

    setPositionFromIndex,
    setOrientation,
    setNextPosition,
    getPosition,
    getFen,
    clearGame,
    createMoveOrNull,
    getPieceAtSquare,
  };
};
