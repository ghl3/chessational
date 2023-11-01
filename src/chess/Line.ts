import { Chapter, MoveNode, Node } from "./Chapter";
import { Fen } from "./Fen";
import { Move } from "./Move";

export interface Line {
  chapter: Chapter;
  moves: Move[];
}

export type LineStatus =
  | "SELECT_MOVE_FOR_WHITE"
  | "SELECT_MOVE_FOR_BLACK"
  | "LINE_COMPLETE";

export const getLineStatus = (line: Line, index: number): LineStatus => {
  if (index === line.moves.length) {
    return "LINE_COMPLETE";
  } else if (index % 2 === 0) {
    return "SELECT_MOVE_FOR_WHITE";
  } else {
    return "SELECT_MOVE_FOR_BLACK";
  }
};
