import { PieceCount } from "@/chess/Fen";
import { Color, PieceSymbol, WHITE } from "chess.js";
import React, { HTMLAttributes, useMemo } from "react";
import { Bishop, King, Knight, Pawn, Queen, Rook } from "./Pieces";

const PieceComponents = {
  k: King,
  q: Queen,
  r: Rook,
  b: Bishop,
  n: Knight,
  p: Pawn,
} as const;

const MATERIAL_VALUES: Record<PieceSymbol, number> = {
  k: 0,
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
};

const INITIAL_PIECES: Record<PieceSymbol, number> = {
  k: 1,
  q: 1,
  r: 2,
  b: 2,
  n: 2,
  p: 8,
};

interface MaterialDiffProps extends HTMLAttributes<HTMLDivElement> {
  pieceCount: PieceCount;
  color: Color;
}

export const MaterialDiff: React.FC<MaterialDiffProps> = ({
  pieceCount,
  color,
  className = "",
}) => {
  const { whiteCaptured, blackCaptured, materialBalance } = useMemo(() => {
    const whitePieces = pieceCount.white;
    const blackPieces = pieceCount.black;
    const whiteCaptured = new Map<PieceSymbol, number>();
    const blackCaptured = new Map<PieceSymbol, number>();
    let materialSum = 0;

    (["q", "r", "b", "n", "p"] as PieceSymbol[]).forEach((piece) => {
      const whiteMissing =
        INITIAL_PIECES[piece] - (whitePieces.get(piece) || 0);
      const blackMissing =
        INITIAL_PIECES[piece] - (blackPieces.get(piece) || 0);

      // Only record captures that haven't been cancelled out
      if (whiteMissing > blackMissing) {
        // Black captured more white pieces of this type than vice versa
        blackCaptured.set(piece, whiteMissing - blackMissing);
        materialSum -= MATERIAL_VALUES[piece] * (whiteMissing - blackMissing);
      } else if (blackMissing > whiteMissing) {
        // White captured more black pieces of this type than vice versa
        whiteCaptured.set(piece, blackMissing - whiteMissing);
        materialSum += MATERIAL_VALUES[piece] * (blackMissing - whiteMissing);
      }
    });

    return { whiteCaptured, blackCaptured, materialBalance: materialSum };
  }, [pieceCount]);

  // Get the relevant captures for this side
  const captures = color === WHITE ? whiteCaptured : blackCaptured;
  const isAhead = color === WHITE ? materialBalance > 0 : materialBalance < 0;
  const advantage = Math.abs(materialBalance);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from(captures).map(([piece, count]) => {
        const Component =
          PieceComponents[piece as keyof typeof PieceComponents];
        return (
          <span key={piece} className="flex items-center gap-px">
            {Array.from({ length: count }).map((_, i) => (
              <Component
                key={i}
                color={color === WHITE ? "black" : "white"} // Show captured pieces in opponent's color
                size="s"
              />
            ))}
          </span>
        );
      })}

      {isAhead && advantage > 0 && (
        <span className="text-xs font-bold">+{advantage}</span>
      )}
    </div>
  );
};
