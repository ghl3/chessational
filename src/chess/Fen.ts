import { Color, PieceSymbol } from "chess.js";

export type Fen = string;

export type FenComponents = {
  board: string;
  turn: string;
  castling: string;
  enPassant: string;
  halfMoveClock: string;
  fullMoveNumber: string;
};

export const fenToComponents = (fen: Fen): FenComponents => {
  const [board, turn, castling, enPassant, halfMoveClock, fullMoveNumber] =
    fen.split(" ");

  return {
    board,
    turn,
    castling,
    enPassant,
    halfMoveClock,
    fullMoveNumber,
  };
};

export const DEFAULT_FEN: Fen =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Normalize FEN for comparison by ignoring move counts.
 * FEN format: "board turn castling en-passant halfmove fullmove"
 * This keeps only: board, turn, castling, en-passant (first 4 parts)
 * 
 * This is useful when comparing positions regardless of when they occurred
 * in a game (e.g., same position reached via different move orders).
 */
export const normalizeFen = (fen: Fen): string => {
  const parts = fen.split(" ");
  return parts.slice(0, 4).join(" ");
};

export class FenUtil {
  static getTurn = (fen: Fen): Color => {
    return fen.split(" ")[1] as Color;
  };
}

export interface PieceCount {
  white: Map<PieceSymbol, number>;
  black: Map<PieceSymbol, number>;
}

export const getPieceCounts = (fen: Fen): PieceCount => {
  const initialCount = (): Map<PieceSymbol, number> =>
    new Map([
      ["p", 0],
      ["r", 0],
      ["n", 0],
      ["b", 0],
      ["q", 0],
      ["k", 0],
    ]);

  const pieceCounts: PieceCount = {
    white: initialCount(),
    black: initialCount(),
  };

  // The first part of the FEN is the board.
  const board = fen.split(" ")[0];

  // Iterate over the board and count the pieces.
  for (const char of board.replace(/\d|\/| /g, "")) {
    const color: Color = char === char.toUpperCase() ? "w" : "b";
    const piece = char.toLowerCase() as PieceSymbol;

    if (color === "w") {
      const count = pieceCounts.white.get(piece) || 0;
      pieceCounts.white.set(piece, count + 1);
    } else {
      const count = pieceCounts.black.get(piece) || 0;
      pieceCounts.black.set(piece, count + 1);
    }
  }

  return pieceCounts;
};
