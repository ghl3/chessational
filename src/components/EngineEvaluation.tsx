import { Fen } from "@/chess/Fen";
import {
  EvaluatedPosition,
  MoveAndEvaluation,
} from "@/engine/EvaluatedPosition";
import { EvaluationUtil } from "@/engine/Evaluation";
import { useEffect, useMemo, useState } from "react";
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
  const [moveEvals, setMoveEvals] = useState<
    Map<Fen, Map<string, MoveAndEvaluation>>
  >(new Map());

  // Ensure moveEvals contains the latest eval for each move
  useEffect(() => {
    if (!positionEvaluation) {
      setMoveEvals(new Map());
      return;
    }

    setMoveEvals((prevMoveEvals) => {
      const fen = positionEvaluation.fen;

      const updatedMoveEvals = new Map(prevMoveEvals);

      // Clear other fens
      for (const existingFen of updatedMoveEvals.keys()) {
        if (existingFen !== fen) {
          updatedMoveEvals.delete(existingFen);
        }
      }

      if (!updatedMoveEvals.has(fen)) {
        updatedMoveEvals.set(fen, new Map());
      }

      for (const move of positionEvaluation.best_moves) {
        const san = move.move.san ?? "";
        updatedMoveEvals.get(fen)?.set(san, move);
      }
      return updatedMoveEvals;
    });
  }, [positionEvaluation]);

  const bestMoves = useMemo(() => {
    if (!positionEvaluation) {
      return [];
    }

    return Array.from(moveEvals.get(positionEvaluation.fen) || [])
      .filter((x) => x[1].evaluation?.score != null)
      .sort((a, b) => {
        const scoreA = a[1]?.evaluation?.score || 0;
        const scoreB = b[1]?.evaluation?.score || 0;
        return positionEvaluation.color === "w"
          ? scoreB - scoreA
          : scoreA - scoreB;
      })
      .map((x) => x[1])
      .slice(0, MAX_NUM_MOVES_SHOWN);
  }, [moveEvals, positionEvaluation]);

  if (!showEngine) {
    return null;
  }

  if (!positionEvaluation || moveEvals.size === 0) {
    return (
      <Table
        title={
          "Engine Analysis - Depth: " +
          (positionEvaluation?.best_moves[0]?.evaluation.depth || 0)
        }
        headers={["Index", "Move", "Evaluation"]}
        rows={[]}
        loading={!positionEvaluation}
        minRows={MAX_NUM_MOVES_SHOWN}
      />
    );
  }

  const rows = bestMoves.slice(0, MAX_NUM_MOVES_SHOWN).map((move, idx) => {
    return [
      <>{idx + 1}</>,
      <>{move.move.san}</>,
      <>{EvaluationUtil.toEvalString(move.evaluation)}</>,
    ];
  });

  const depth = positionEvaluation.best_moves[0].evaluation.depth;

  return (
    <Table
      title={"Engine Analysis - Depth: " + depth}
      headers={["Index", "Move", "Evaluation"]}
      rows={rows}
      loading={!positionEvaluation}
      minRows={MAX_NUM_MOVES_SHOWN}
    />
  );
};
