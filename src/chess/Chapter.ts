import { Color } from "chess.js";

export type Chapter = {
  name: string;
  studyName: string;
  orientation: Color;
  headers: { [key: string]: string };
  comments: string[];
  //positionTree: PositionTree;
  //lines: Line[];
};
