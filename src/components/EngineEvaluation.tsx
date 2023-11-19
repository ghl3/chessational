import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { EvaluationUtil } from "@/engine/Evaluation";
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

  const rows = moves.slice(0, MAX_NUM_MOVES_SHOWN).map((move, idx) => {
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
