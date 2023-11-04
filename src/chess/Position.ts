import { Move } from "chess.js";
import { Fen } from "./Fen";

export type GameResult =
  | "UNKNOWN"
  | "CHECKMATE"
  | "STALEMATE"
  | "INSUFFICIENT_MATERIAL"
  | "THREEFOLD_REPETITION"
  | "DRAW";

export interface Position {
  fen: Fen;
  // The move that led to this position
  lastMove: Move | null;
  comments: string[];
  isGameOver: boolean;
  gameResult?: GameResult;
}
