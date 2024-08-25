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
      return "text-green-400";
    case "INCORRECT":
      return "text-red-400";
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
    <div className="flex flex-col space-y-2 p-4">
      <p className="text-gray-400" style={{ minHeight: "1.5em" }}>
        {lineStatusText}
      </p>
      <p className={moveResultColor} style={{ minHeight: "1.5em" }}>
        {moveResultText}
      </p>
    </div>
  );
};
