export type Color = "w" | "b";

export const getOppositeColor = (color: Color): Color => {
  return color === "w" ? "b" : "w";
};

export type Fen = string;

export class FenUtil {
  static getTurn = (fen: Fen): Color => {
    return fen.split(" ")[1] as Color;
  };
}

export interface Position {
  fen: Fen;
  color: Color;
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
  piece: string;
  from: string;
  to: string;
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
