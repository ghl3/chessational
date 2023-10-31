import { Move } from "./Move";
import { Color } from "chess.js";

export interface RootNode {
  children: MoveNode[];
}

export interface MoveNode extends Move {
  children: MoveNode[];
}

export type Node = RootNode | MoveNode;

export type Chapter = {
  name: string;
  studyName: string;
  orientation: Color;
  headers: { [key: string]: string };
  moveTree: RootNode;
};
