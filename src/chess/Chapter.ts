import { Color } from "chess.js";
import { PositionTree } from "./PositionTree";

export type Chapter = {
  name: string;
  studyName: string;
  orientation: Color;
  headers: { [key: string]: string };
  comments: string[];
  positionTree: PositionTree;
};
