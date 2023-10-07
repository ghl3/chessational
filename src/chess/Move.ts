import { Square, PieceSymbol, Color } from "chess.js";
import { Fen } from "./Fen";

export const getOppositeColor = (color: Color): Color => {
  return color === "w" ? "b" : "w";
};

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
