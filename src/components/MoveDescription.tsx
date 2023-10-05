import React from "react";

export type LineStatus =
  | "SELECT_MOVE_FOR_WHITE"
  | "SELECT_MOVE_FOR_BLACK"
  | "LINE_COMPLETE";

export type MoveResult = "CORRECT" | "INCORRECT";

export interface LineState {
  status?: LineStatus;
  result?: MoveResult;
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

const getMoveResultText = (result: MoveResult | null): string => {
  switch (result) {
    case "CORRECT":
      return "Correct";
    case "INCORRECT":
      return "Incorrect";
    default:
      return "";
  }
};

const getMoveResultColor = (result: MoveResult | null): string => {
  switch (result) {
    case "CORRECT":
      return "text-green-400";
    case "INCORRECT":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
};

export const MoveDescription: React.FC<LineState> = ({ status, result }) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="text-gray-400">{getLineStatusText(status || null)}</div>
      <div className={getMoveResultColor(result || null)}>
        {getMoveResultText(result || null)}
      </div>
    </div>
  );
};
