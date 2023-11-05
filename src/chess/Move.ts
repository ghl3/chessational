import { Square, PieceSymbol, Color, Move as MoveResult } from "chess.js";

export const getOppositeColor = (color: Color): Color => {
  return color === "w" ? "b" : "w";
};
/*
export const moveResultToMove = (moveResult: MoveResult, resultingFen: Fen, isGame): Move => {
  return {
    move: moveResult.san,
    piece: moveResult.piece,
    from: moveResult.from,
    to: moveResult.to,
    player: moveResult.color,
    fen: resultingFen,
    
  };
};
*/

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
