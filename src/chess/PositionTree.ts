import { Position } from "./Position";

export interface PositionNode {
  position: Position;
  children: PositionNode[];
}

export type PositionTree = PositionNode;
