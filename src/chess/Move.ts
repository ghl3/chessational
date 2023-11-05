import { Square, PieceSymbol, Color, Move as MoveResult } from "chess.js";

export const getOppositeColor = (color: Color): Color => {
  return color === "w" ? "b" : "w";
};

export const moveResultToMove = (moveResult: MoveResult): Move => {
  return {
    san: moveResult.san,
    piece: moveResult.piece,
    from: moveResult.from,
    to: moveResult.to,
    promotion: moveResult.promotion,
    player: moveResult.color,
  };
};

const isPromotion = (
  sourceSquare: Square,
  targetSquare: Square,
  piece: string
) => {
  const isPromotion =
    ((piece === "p" && sourceSquare[1] === "7" && targetSquare[1] === "8") ||
      (piece === "p" && sourceSquare[1] === "2" && targetSquare[1] === "1")) &&
    Math.abs(sourceSquare.charCodeAt(0) - targetSquare.charCodeAt(0)) <= 1;

  return isPromotion;
};

export const convertToPieceSymbol = (
  piece?: string | null
): PieceSymbol | undefined => {
  if (piece === undefined) {
    return undefined;
  }

  if (piece === "wQ" || piece === "bQ") {
    return "q";
  }

  if (piece === "wR" || piece === "bR") {
    return "r";
  }

  if (piece === "wB" || piece === "bB") {
    return "b";
  }

  if (piece === "wN" || piece === "bN") {
    return "n";
  }

  if (piece === "wK" || piece === "bK") {
    return "k";
  }

  if (piece === "wP" || piece === "bP") {
    return "p";
  }

  throw new Error(`Unknown piece: ${piece}`);
};

export const getPromoteToPiece = (
  sourceSquare: Square,
  targetSquare: Square,
  originalPiece: PieceSymbol,
  promotedToPiece?: PieceSymbol
): PieceSymbol | undefined => {
  if (isPromotion(sourceSquare, targetSquare, originalPiece)) {
    if (promotedToPiece === undefined) {
      throw new Error("Must specify promotedToPiece");
    }
    return promotedToPiece;
  } else {
    return undefined;
  }
};

export interface Move {
  // The move that was made.
  san: string;
  piece: PieceSymbol;
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  // The color of the player who made the move.
  player: Color;
}
