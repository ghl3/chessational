import { Color } from "./Color";
import { Fen } from "./Fen";

export type GameState = "CHECK" | "CHECKMATE" | "STALEMATE" | "DRAW" | "OTHER";

export interface Position {
  fen: Fen;
  color: Color;
}
