import { Move } from "./Move";
import { Fen } from "./Fen";
import { Chess } from "chess.js";

export type GameResult =
  | "UNKNOWN"
  | "CHECKMATE"
  | "STALEMATE"
  | "INSUFFICIENT_MATERIAL"
  | "THREEFOLD_REPETITION"
  | "DRAW";

export const getGameResult = (chess: Chess): GameResult => {
  if (chess.isCheckmate()) {
    return "CHECKMATE";
  } else if (chess.isStalemate()) {
    return "STALEMATE";
  } else if (chess.isInsufficientMaterial()) {
    return "INSUFFICIENT_MATERIAL";
  } else if (chess.isThreefoldRepetition()) {
    return "THREEFOLD_REPETITION";
  } else if (chess.isDraw()) {
    return "DRAW";
  } else {
    return "UNKNOWN";
  }
};

export interface Position {
  fen: Fen;
  // The move that led to this position
  lastMove: Move | null;
  comments: string[];
  isGameOver: boolean;
  gameResult?: GameResult;
}

export const createPosition = (move: Move, chess: Chess): Position => {
  const fen = chess.fen();
  const lastMove = move;
  const comments: string[] = [];
  const isGameOver = chess.isGameOver();
  const gameResult = getGameResult(chess);

  return {
    fen: fen,
    lastMove: lastMove,
    comments: comments,
    isGameOver: isGameOver,
    gameResult: gameResult,
  };
};
