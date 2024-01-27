import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { EvaluationUtil } from "@/engine/Evaluation";
import { useMemo } from "react";
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

  if (!showEngine) {
    return null;
  } else if (
    !positionEvaluation ||
    positionEvaluation.best_moves.length === 0
  ) {
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
