import { Square, PieceSymbol, Color } from "chess.js";

export const getOppositeColor = (color: Color): Color => {
  return color === "w" ? "b" : "w";
};

export type Fen = string;

export class FenUtil {
  static getTurn = (fen: Fen): Color => {
    return fen.split(" ")[1] as Color;
  };
}

export type GameResult =
  | "UNKNOWN"
  | "CHECKMATE"
  | "STALEMATE"
  | "INSUFFICIENT_MATERIAL"
  | "THREEFOLD_REPETITION"
  | "DRAW";

export interface Move {
  // The move that was made.
  move: string;
  piece: PieceSymbol;
  from: Square;
  to: Square;
  // The color of the player who made the move.
  player: Color;
  // The fen of the position after the move.
  fen: Fen;
  isGameOver: boolean;
  gameResult?: GameResult;
  comments?: string[];
}

export interface MoveNode extends Move {
  children: MoveNode[];
}

// A Tree Representation
export interface PgnTree {
  study: string;
  chapter: string;
  orientation: Color;
  headers: { [key: string]: string };
  moveTree: MoveNode[];
}
