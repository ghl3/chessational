import { Move } from "./Move";
import { Position } from "./Position";

export interface Game {
  id: string;
  white: string;
  black: string;
  moves: Move[];
  // positions[0] is the starting position.
  // positions[i] is the position after the ith move.
  positions: Position[];
}
