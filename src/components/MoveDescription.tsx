import { LineStatus } from "@/chess/Line";
import { Move } from "@/chess/Move";
import React, { useEffect } from "react";

export type LineMoveResult = "CORRECT" | "INCORRECT";

export interface MoveDescriptionProps {
  move?: Move;
  status?: LineStatus;
  result?: LineMoveResult;
}

const getLineStatusText = (status: LineStatus | null): string => {
  switch (status) {
    case "SELECT_MOVE_FOR_WHITE":
      return "Select a move for White";
    case "SELECT_MOVE_FOR_BLACK":
      return "Select a move for Black";
    case "LINE_COMPLETE":
      return "This is the end of the line";
    default:
      return "";
  }
};

const getMoveResultText = (
  result: LineMoveResult | null,
  showResult: boolean
): string => {
  if (!showResult) return "";
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
  move,
  status,
  result,
}) => {
  const [showResult, setShowResult] = React.useState<boolean>(true);

  useEffect(() => {
    // Show result immediately when either result or fen changes
    setShowResult(true);

    let timer: NodeJS.Timeout;
    if (result) {
      timer = setTimeout(() => {
        setShowResult(false);
      }, 2000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [result, move?.fen]);

  return (
    <div className="flex flex-col space-y-2">
      <div className="text-gray-400">{getLineStatusText(status || null)}</div>
      <div className={getMoveResultColor(result || null)}>
        {getMoveResultText(result || null, showResult)}
      </div>
    </div>
  );
};
