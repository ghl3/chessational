import { Move } from "./Move";
import { Color } from "chess.js";

export interface RootNode {
  children: MoveNode[];
}

export interface MoveNode extends Move {
  children: MoveNode[];
}

export type LineNode = RootNode | MoveNode;

export type Chapter = {
  //index: number;
  name: string;
  studyName: string;
  orientation: Color;
  headers: { [key: string]: string };
  moveTree: RootNode;
};
