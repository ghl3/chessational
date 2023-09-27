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

export type GameState = "CHECK" | "CHECKMATE" | "STALEMATE" | "DRAW" | "OTHER";
/*
export interface Move {
  move: string;
  comments: string[];
  / *
  from: string;
  to: string;
  promotion?: string | undefined;
  color: "w" | "b";
  piece?: string;
  san?: string;
  captured?: string;
  flags?: string;
  lan?: string;
  before?: string;
  after?: string;
  * /
}
*/
export interface MoveNode {
  move: string;
  comments?: string[];
  children: MoveNode[];
}

// A Tree Representation
export interface PgnTree {
  headers: { [key: string]: string };
  perspective: Color;
  moveTree: MoveNode[];
}
