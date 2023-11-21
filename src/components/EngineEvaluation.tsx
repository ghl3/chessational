import {
  EvaluatedPosition,
  MoveAndEvaluation,
} from "@/engine/EvaluatedPosition";
import { EvaluationUtil } from "@/engine/Evaluation";
import { useState } from "react";
import Table from "./Table";

const MAX_NUM_MOVES_SHOWN = 3;

interface EngineEvaluationProps extends React.HTMLAttributes<HTMLDivElement> {
  showEngine: boolean;
  positionEvaluation?: EvaluatedPosition;
}

export const EngineEvaluation: React.FC<EngineEvaluationProps> = ({
  showEngine,
  positionEvaluation,
}) => {
  const [moveEvals, setMoveEvals] = useState<Map<string, MoveAndEvaluation>>(
    new Map(),
  );

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

  const moves = positionEvaluation.best_moves;
  const depth = moves[0].evaluation.depth;

  if (!showEngine || moves.length === 0) {
    return null;
  }

  // Update the move evaluations
  const evalUpdates = new Map<string, MoveAndEvaluation>();

  for (const move of moves) {
    if (move.evaluation.score == null) {
      continue;
    }
    if (!moveEvals.has(move.move.san || "")) {
      evalUpdates.set(move.move.san || "", move);
    } else if (
      move.evaluation.score !=
      moveEvals.get(move.move.san || "")?.evaluation.score
    ) {
      evalUpdates.set(move.move.san || "", move);
    }
  }

  if (evalUpdates.size > 0) {
    setMoveEvals((prevMoveEvals) => {
      const updatedMoveEvals = new Map(prevMoveEvals);
      evalUpdates.forEach((value, key) => {
        updatedMoveEvals.set(key, value);
      });
      return updatedMoveEvals;
    });
  }

  // Take moveEvals and order by the score (based on the current color)
  const bestMoves = Array.from(moveEvals)
    .filter((x) => x[1].evaluation?.score != null)
    .sort((a, b) => {
      if (positionEvaluation.color === "w") {
        return (b[1]?.evaluation?.score || 0) - (a[1]?.evaluation?.score || 0);
      } else {
        return (a[1]?.evaluation?.score || 0) - (b[1]?.evaluation?.score || 0);
      }
    })
    .map((x) => x[1]);

  const rows = bestMoves.slice(0, MAX_NUM_MOVES_SHOWN).map((move, idx) => {
    return [
      <>{idx + 1}</>,
      <>{move.move.san}</>,
      <>{EvaluationUtil.toEvalString(move.evaluation)}</>,
    ];
  });

  console.log("Position Evaluation");
  console.log(positionEvaluation);
  console.log("moveEvals");
  console.log(moveEvals);

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
