import { PieceSymbol, Color } from "chess.js";

export type Fen = string;

export class FenUtil {
  static getTurn = (fen: Fen): Color => {
    return fen.split(" ")[1] as Color;
  };
}

interface PieceCount {
  white: { [piece: string]: number };
  black: { [piece: string]: number };
}

export const getPieceCounts = (fen: Fen): PieceCount => {
  const initialCount = { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 };

  const pieceCounts: PieceCount = {
    white: { ...initialCount },
    black: { ...initialCount },
  };

  // The first part of the FEN is the board.
  const board = fen.split(" ")[0];

  // Iterate over the board and count the pieces.
  for (const char of board.replace(/\d|\/| /g, "")) {
    const color: Color = char === char.toUpperCase() ? "w" : "b";
    const piece = char.toLowerCase() as PieceSymbol;

    pieceCounts[color === "w" ? "white" : "black"][piece]++;
  }

  return pieceCounts;
};
