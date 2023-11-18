import { Chapter } from "./Chapter";
import { Position } from "./Position";

export type Line = {
  studyName: string;
  chapter: Chapter;
  moves: Position[];
};
export type LineStatus =
  | "SELECT_MOVE_FOR_WHITE"
  | "SELECT_MOVE_FOR_BLACK"
  | "LINE_COMPLETE";

export const getLineStatus = (line: Line, index: number): LineStatus => {
  if (index === line.moves.length - 1) {
    return "LINE_COMPLETE";
  } else if (index % 2 === 0) {
    return "SELECT_MOVE_FOR_WHITE";
  } else {
    return "SELECT_MOVE_FOR_BLACK";
  }
};

export const lineToSan = (line: Line): string[] => {
  return line.moves
    .filter((position) => position.lastMove != null)
    .map((position) => position.lastMove?.san ?? "");
};
