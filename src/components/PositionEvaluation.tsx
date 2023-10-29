import {
  EvaluatedPosition,
  MoveAndEvaluation,
} from "@/engine/EvaluatedPosition";
import { Evaluation, EvaluationUtil } from "@/engine/Evaluation";
import { Color } from "chess.js";
import Table from "./Table";

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

interface PositionEvaluationProps extends React.HTMLAttributes<HTMLDivElement> {
  showEngine: boolean;
  positionEvaluation?: EvaluatedPosition;
}

export const PositionEvaluation: React.FC<PositionEvaluationProps> = ({
  showEngine,
  positionEvaluation,
}) => {
  if (!showEngine) {
    return null;
  }

  if (positionEvaluation == null) {
    return (
      <Table
        title={"Engine Analysis - Depth: " + 0}
        headers={["Index", "Move", "Evaluation"]}
        rows={[]}
        loading={positionEvaluation == null}
        minRows={MAX_NUM_MOVES_SHOWN}
      />
    );
  }
  const goodMoves = findGoodMoves(positionEvaluation.best_moves);

  const depth = goodMoves[0].evaluation.depth;

  if (!showEngine || goodMoves.length === 0) {
    return null;
  }

  const rows = goodMoves.slice(0, MAX_NUM_MOVES_SHOWN).map((move, idx) => {
    return [
      <>{idx + 1}</>,
      <>{move.move.san}</>,
      <>{EvaluationUtil.toEvalString(move.evaluation)}</>,
    ];
  });

  return (
    <Table
      title={"Engine Analysis - Depth: " + depth}
      headers={["Index", "Move", "Evaluation"]}
      rows={rows}
      loading={positionEvaluation == null}
      minRows={MAX_NUM_MOVES_SHOWN}
    />
  );
};
