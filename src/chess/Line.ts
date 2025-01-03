import { Color } from "chess.js";
import { Position } from "./Position";

export type Line = {
  studyName: string;
  chapterName: string;
  lineId: string;
  orientation: Color;
  positions: Position[];
};

export const createLineId = (moves: Position[]): string => {
  return moves
    .slice(1)
    .map((position) => position.lastMove?.san || "")
    .join(" ");
};

export type LineStatus = "WHITE_TO_MOVE" | "BLACK_TO_MOVE" | "LINE_COMPLETE";

export const getLineStatus = (line: Line, index: number): LineStatus => {
  if (index === line.positions.length - 1) {
    return "LINE_COMPLETE";
  } else if (index % 2 === 0) {
    return "WHITE_TO_MOVE";
  } else {
    return "BLACK_TO_MOVE";
  }
};

export const lineToSan = (line: Line): string[] => {
  return line.positions
    .filter((position) => position.lastMove != null)
    .map((position) => position.lastMove?.san ?? "");
};
