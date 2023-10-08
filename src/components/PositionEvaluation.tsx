import {
  EvaluatedPosition,
  MoveAndEvaluation,
} from "@/engine/EvaluatedPosition";
import { Evaluation, EvaluationUtil } from "@/engine/Evaluation";
import { Color } from "chess.js";

const MAX_NUM_MOVES_SHOWN = 3;

export const getColorIndependentScore = (
  color: Color,
  score: number
): number => {
  const colorFactor = color === "w" ? 1 : -1;
  return score * colorFactor;
};

export const doesMaintainForcedMateFor = (
  moveEvaluation: Evaluation,
  positionEvaluation: Evaluation
): boolean | null => {
  if (positionEvaluation?.forced_mate?.for !== "PLAYER") {
    return null;
  } else {
    return moveEvaluation?.forced_mate?.for === "PLAYER";
  }
};

export const doesMaintainForcedMateAgainst = (
  moveEvaluation: Evaluation,
  positionEvaluation: Evaluation
): boolean | null => {
  if (positionEvaluation?.forced_mate?.for === "OPPONENT") {
    return moveEvaluation?.forced_mate?.for === "OPPONENT";
  } else {
    return null;
  }
};

export const doesBlunderForcedMateAgainst = (
  moveEvaluation: Evaluation,
  positionEvaluation: Evaluation
): boolean => {
  return (
    positionEvaluation?.forced_mate?.for !== "OPPONENT" &&
    moveEvaluation?.forced_mate?.for === "OPPONENT"
  );
};

export const getMoveScoreDelta = (
  turn: Color,
  moveEvaluation: Evaluation,
  positionEvaluation: Evaluation
): number | null => {
  const colorFactor = turn === "w" ? 1 : -1;
  if (positionEvaluation.score != null && moveEvaluation.score != null) {
    return (
      colorFactor * positionEvaluation.score -
      colorFactor * moveEvaluation.score
    );
  } else {
    return null;
  }
};

export const isGoodMove = (
  turn: Color,
  moveEvaluation: Evaluation,
  positionEvaluation: Evaluation,
  scoreThreshold: number,
  scoreDropThreshold: number
): boolean => {
  if (
    doesMaintainForcedMateAgainst(moveEvaluation, positionEvaluation) ||
    doesBlunderForcedMateAgainst(moveEvaluation, positionEvaluation)
  ) {
    return false;
  }
  if (moveEvaluation?.forced_mate?.for === "PLAYER") {
    return true;
  }

  if (
    moveEvaluation.score != null &&
    getColorIndependentScore(turn, moveEvaluation.score) >= scoreThreshold
  ) {
    return true;
  }

  const delta = getMoveScoreDelta(turn, moveEvaluation, positionEvaluation);

  if (delta != null && delta < scoreDropThreshold) {
    return true;
  }

  return false;
};

const findGoodMoves = (moves: MoveAndEvaluation[]): MoveAndEvaluation[] => {
  // If we have no choice, we make the move
  if (moves.length <= 1) {
    return moves;
  }

  const topMoveEval = moves[0].evaluation;
  const goodMoves: MoveAndEvaluation[] = [];

  for (const move of moves) {
    if (isGoodMove(move.move.color, move.evaluation, topMoveEval, 300, 50)) {
      goodMoves.push(move);
    } else {
      continue;
    }
  }

  return goodMoves;
};

const createMoveRow = (move: MoveAndEvaluation, idx: number) => {
  return (
    <tr key={idx}>
      <td data-label="Move Rank">{idx + 1}</td>
      <td data-label="Move">{move.move.san}</td>
      <td data-label="Evaluation">
        {EvaluationUtil.toEvalString(move.evaluation)}
      </td>
    </tr>
  );
};

interface PositionEvaluationProps extends React.HTMLAttributes<HTMLDivElement> {
  positionEvaluation?: EvaluatedPosition;
}

export const PositionEvaluation: React.FC<PositionEvaluationProps> = ({
  positionEvaluation,
}) => {
  if (positionEvaluation == null) {
    return null;
  }
  const goodMoves = findGoodMoves(positionEvaluation.best_moves);

  return (
    <table className="ui celled table">
      <thead>
        <tr>
          <th>Move Rank</th>
          <th>Move</th>
          <th>Evaluation</th>
        </tr>
      </thead>
      <tbody>
        {goodMoves.slice(0, MAX_NUM_MOVES_SHOWN).map(createMoveRow)}
      </tbody>
    </table>
  );
};
