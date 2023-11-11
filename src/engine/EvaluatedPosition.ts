import { PieceMove } from "./Engine";
import { Evaluation } from "./Evaluation";
import { Fen } from "../chess/Fen";
import { Color } from "chess.js";

export interface MoveAndEvaluation {
  move: PieceMove;
  evaluation: Evaluation;
}

export interface EvaluatedPosition {
  fen: Fen;
  color: Color;
  best_moves: MoveAndEvaluation[];
}

export class EvaluatedPositionUtil {
  static findMoveEval = (
    evaluatedPosition: EvaluatedPosition,
    m: PieceMove,
  ) => {
    for (const { move, evaluation } of evaluatedPosition.best_moves) {
      // TODO: Create a move equality function
      if (
        move.from === m.from &&
        move.to === m.to &&
        move.promotion === m.promotion
      ) {
        return evaluation;
      }
    }
    return null;
  };
}
