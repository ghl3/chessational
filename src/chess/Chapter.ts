import { Color } from "chess.js";
import { Line } from "./Line";
import { PositionTree } from "./PositionTree";

export type Chapter = {
  name: string;
  studyName: string;
  orientation: Color;
  headers: { [key: string]: string };
  comments: string[];
  positionTree: PositionTree;
  lines: Line[];
};
