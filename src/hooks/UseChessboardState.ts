import { useState, useRef, useCallback, useReducer, useEffect } from "react";
import { Square } from "react-chessboard/dist/chessboard/types";
import { Position, createPosition } from "@/chess/Position";
import { Chess, Move as MoveResult, Color, WHITE, PieceSymbol } from "chess.js";
import { Fen } from "@/chess/Fen";
import { Move, moveResultToMove } from "@/chess/Move";

// A Chessboard can be thought of as a series of moves and
// positions as well as an orientation and board size.
export interface ChessboardState {
  positions: Position[];
  //positionIndex: number;
  orientation: Color;

  getPosition: () => Position | null;
  getPositionIndex: () => number;
  getFen: () => Fen | null;
  createMoveOrNull: (
    sourceSquare: Square,
    targetSquare: Square,
    promotion?: PieceSymbol
  ) => [Move, Position] | null;
  getPieceAtSquare: (square: Square) => PieceSymbol | null;

  // The mutating functions
  clearGame: () => void;
  setPositionFromIndex: (moveIndex: number) => void;
  setNextPosition: (position: Position, overwrite: boolean) => void;
  setOrientation: React.Dispatch<React.SetStateAction<Color>>;
}

interface GameState {
  positions: Position[];
  currentPositionIndex: number;
}

type GameAction =
  | { type: "CLEAR_HISTORY" }
  | {
      type: "ADD_NEXT_POSITION";
      position: Position;

      overwriteHistory: boolean;
    }
  | { type: "SET_POSITION_FROM_INDEX"; moveIndex: number };

const initialState: GameState = {
  positions: [],
  currentPositionIndex: -1,
};

const clearGameState = (state: GameState): GameState => {
  return { ...state, positions: [], currentPositionIndex: -1 };
};

const addNextPosition = (
  state: GameState,
  position: Position,
  overwriteHistory: boolean
): GameState => {
  //gameObject.current.load(position.fen);

  const { positions, currentPositionIndex } = state;

  if (currentPositionIndex === positions.length - 1) {
    // If we are at the end of the line and we move, we just add it to the set of moves
    return {
      ...state,
      positions: [...positions, position],
      currentPositionIndex: state.currentPositionIndex + 1,
    };
    //setPositions((positions) => [...positions, position]);
    //setPositionIndex((positionIndex) => positionIndex + 1);
  } else if (overwriteHistory) {
    // If we are not at the end of the line and we move, we overwrite the line
    // with the new move and all subsequent moves

    return {
      ...state,
      positions: positions.slice(0, currentPositionIndex + 1).concat(position),
      currentPositionIndex: currentPositionIndex + 1,
    };

    //setPositions((positions) =>
    //  positions.slice(0, positionIndex + 1).concat(position)
    //  );
    // setPositionIndex((positionIndex) => positionIndex + 1);
  } else {
    throw new Error(
      "Cannot move from a previous position or this will overwrite the line"
    );
  }
};

// TODO: we have to update this using useReducer
// to ensure that clears and sets can be called from the same function.
// Yikes.
// Return to an existing position in the history.
const setPositionFromIndex = (
  state: GameState,
  moveIndex: number
): GameState => {
  if (moveIndex < 0) {
    throw new Error("Position index is negative");
  } else if (moveIndex >= state.positions.length) {
    throw new Error("Position index is too large");
  } else {
    return {
      ...state,
      currentPositionIndex: moveIndex,
    };
  }
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "CLEAR_HISTORY":
      return clearGameState(state);
    case "ADD_NEXT_POSITION": {
      return addNextPosition(state, action.position, action.overwriteHistory);
    }
    case "SET_POSITION_FROM_INDEX": {
      return setPositionFromIndex(state, action.moveIndex);
    }
    default:
      return state;
  }
};

export const useChessboardState = (): ChessboardState => {
  //const [positions, setPositions] = useState<Position[]>([]);
  //const [positionIndex, setPositionIndex] = useState<number>(-1);
  const [orientation, setOrientation] = useState<Color>(WHITE);

  const [gameState, dispatch] = useReducer(gameReducer, initialState);
  const { positions, currentPositionIndex } = gameState;

  // Create a game reference and ensure it's up to date
  let gameObject = useRef<Chess>(new Chess());
  useEffect(() => {
    if (positions.length > 0 && currentPositionIndex >= 0) {
      gameObject.current.load(positions[currentPositionIndex].fen);
    } else {
      gameObject.current = new Chess();
    }
  }, [positions, currentPositionIndex]);

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

  const getPosition = useCallback((): Position | null => {
    if (currentPositionIndex < 0) {
      return null;
    } else if (currentPositionIndex >= positions.length) {
      throw new Error("Position index is too large");
    } else {
      return positions[currentPositionIndex];
    }
  }, [positions, currentPositionIndex]);

  const getFen = useCallback((): Fen | null => {
    const position = getPosition();
    if (position == null) {
      return null;
    } else {
      return position.fen;
    }
  }, [getPosition]);

  return {
    positions,
    orientation,

    getPosition,
    getPositionIndex: () => currentPositionIndex,
    getFen,
    createMoveOrNull,
    getPieceAtSquare,

    clearGame: () => {
      dispatch({ type: "CLEAR_HISTORY" });
    },

    setPositionFromIndex: (moveIndex: number) => {
      dispatch({ type: "SET_POSITION_FROM_INDEX", moveIndex: moveIndex });
    },

    setNextPosition: (position: Position, overwrite: boolean) => {
      dispatch({
        type: "ADD_NEXT_POSITION",
        position: position,
        overwriteHistory: overwrite,
      });
    },

    setOrientation,
  };
};
