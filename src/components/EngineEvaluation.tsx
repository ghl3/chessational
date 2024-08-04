import { Position } from "@/chess/Position";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { EvaluationUtil } from "@/engine/Evaluation";
import { EngineData } from "@/hooks/UseEngineData";
import { useEffect, useMemo } from "react";
import Table from "./Table";

const MAX_NUM_MOVES_SHOWN = 3;

interface EngineEvaluationProps extends React.HTMLAttributes<HTMLDivElement> {
  position: Position;
  engineData: EngineData;
}

export const EngineEvaluation: React.FC<EngineEvaluationProps> = ({
  position,
  engineData,
}) => {
  // Kick off evaluation of the current position

  useEffect(() => {
    if (
      engineData.runEngine &&
      position &&
      position.fen &&
      !engineData.hasEvaluation(position.fen) &&
      engineData.engine
    ) {
      console.log("Evaluating Position: ", position.fen);
      engineData.engine
        .evaluatePosition(position.fen)
        .then((evaluatedPosition) => {
          console.log("Evaluated position: ", position.fen);
        });
    }
  }, [
    position,
    engineData.runEngine,
    engineData.engine,
    engineData.getEvaluation,
    engineData,
  ]);

  const positionEvaluation = position
    ? engineData.getEvaluation(position.fen)
    : null;

  const bestMoves = useMemo(() => {
    if (!positionEvaluation) {
      return [];
    }

    return Array.from(positionEvaluation.best_moves)
      .filter((x) => x.evaluation?.score != null)
      .sort((a, b) => {
        const scoreA = a?.evaluation?.score || 0;
        const scoreB = b?.evaluation?.score || 0;
        // For white, we sort in descending order (b-a)
        // and for black, we sort in ascending order (a-b)
        return positionEvaluation.color === "w"
          ? scoreB - scoreA
          : scoreA - scoreB;
      })
      .slice(0, MAX_NUM_MOVES_SHOWN);
  }, [positionEvaluation]);

  if (!positionEvaluation || positionEvaluation.best_moves.length === 0) {
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
