import { LineStatus } from "@/chess/Line";
import { Position } from "@/chess/Position";
import React, { useMemo } from "react";

export type LineMoveResult = "CORRECT" | "INCORRECT";

export interface MoveDescriptionProps {
  position?: Position;
  status?: LineStatus;
  result?: LineMoveResult;
}

const getLineStatusText = (status: LineStatus | null): string => {
  switch (status) {
    case "WHITE_TO_MOVE":
      return "Select a move for White";
    case "BLACK_TO_MOVE":
      return "Select a move for Black";
    case "LINE_COMPLETE":
      return "This is the end of the line";
    default:
      return "";
  }
};

const getMoveResultText = (result: LineMoveResult | null): string => {
  if (!result) return "";
  switch (result) {
    case "CORRECT":
      return "Correct";
    case "INCORRECT":
      return "Incorrect";
    default:
      return "";
  }
};

const getMoveResultColor = (result: LineMoveResult | null): string => {
  switch (result) {
    case "CORRECT":
      return "text-emerald-400";
    case "INCORRECT":
      return "text-rose-400";
    default:
      return "text-gray-400";
  }
};

export const MoveDescription: React.FC<MoveDescriptionProps> = ({
  status,
  result,
}) => {
  const lineStatusText = useMemo(
    () => getLineStatusText(status || null),
    [status],
  );

  const moveResultText = useMemo(
    () => getMoveResultText(result || null),
    [result],
  );

  const moveResultColor = useMemo(
    () => getMoveResultColor(result || null),
    [result],
  );

  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-700 rounded-lg">
      {lineStatusText && (
        <p className="text-gray-300">{lineStatusText}</p>
      )}
      {moveResultText && (
        <p className={`font-semibold ${moveResultColor}`}>{moveResultText}</p>
      )}
    </div>
  );
};
