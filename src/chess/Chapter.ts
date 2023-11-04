import { Color } from "chess.js";
import { Position } from "./Position";

export interface PositionNode {
  position: Position;
  children: PositionNode[];
}

export type Chapter = {
  name: string;
  studyName: string;
  orientation: Color;
  headers: { [key: string]: string };
  positionTree: PositionNode;
};
