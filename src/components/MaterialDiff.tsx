import React, { HTMLAttributes } from "react";

import { PieceCount } from "@/chess/Fen";
import { BLACK, Color, PieceSymbol, WHITE } from "chess.js";

const pieceToUnicode = (piece: PieceSymbol, color: Color): string => {
  const pieceMap = {
    k: "♔",
    q: "♕",
    r: "♖",
    b: "♗",
    n: "♘",
    p: "♙",
  };

  const unicode = pieceMap[piece];
  return color === BLACK ? unicode.toLowerCase() : unicode;
};

const materialValue: { [piece in PieceSymbol]: number } = {
  k: 0,
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
};

interface MaterialDiffProps extends HTMLAttributes<HTMLDivElement> {
  pieceCount: PieceCount;
  color: Color;
}

export const MaterialDiff: React.FC<MaterialDiffProps> = ({
  pieceCount,
  color,
}) => {
  const diffs: Map<PieceSymbol, number> = new Map();
  const primary = color === WHITE ? pieceCount.white : pieceCount.black;
  const opposite = color === WHITE ? pieceCount.black : pieceCount.white;

  // Calculate material difference
  let materialDiff = 0;
  primary.forEach((count, piece) => {
    materialDiff += materialValue[piece] * count;
  });
  opposite.forEach((count, piece) => {
    materialDiff -= materialValue[piece] * count;
  });

  primary.forEach((count, piece) => {
    const diff = count - (opposite.get(piece) || 0);
    if (diff > 0) {
      diffs.set(piece, diff);
    }
  });

  return (
    <>
      <div className="flex items-center space-x-2">
        {Array.from(diffs).map(([piece, num]) => (
          <span key={piece} className="text-lg">
            {Array.from({ length: Math.abs(num) }).map((_, i) => (
              <span key={i} className="">
                {pieceToUnicode(piece, color)}
              </span>
            ))}
          </span>
        ))}
        {materialDiff > 0 ? (
          <div className="text-xs font-bold ">
            {`+${Math.max(materialDiff, 0)}`}
          </div>
        ) : null}

        {/* A hack to make sure the div doesn't change size
        when a material difference is created*/}
        <div className="text-xs font-bold opacity-0">
          <span key="k2" className="text-lg">
            <span key="-1" className="">
              {pieceToUnicode("k", "w")}
            </span>
          </span>
        </div>
      </div>
    </>
  );
};
