import { Fen } from "@/chess/Fen";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { useCallback, useState } from "react";

const useEvaluationCache = (): [
  (fen: Fen) => EvaluatedPosition | null,
  (evaluatedPosition: EvaluatedPosition) => void,
] => {
  const [moveEvals, setMoveEvals] = useState<Map<Fen, EvaluatedPosition>>(
    new Map(),
  );

  const addEvaluation = useCallback(
    (evaluatedPosition: EvaluatedPosition): void => {
      setMoveEvals((prevMoveEvals) => {
        const newMoveEvals = new Map(prevMoveEvals);
        newMoveEvals.set(evaluatedPosition.fen, evaluatedPosition);
        return newMoveEvals;
      });
    },
    [],
  );

  const getEvaluation = useCallback(
    (fen: Fen) => {
      return moveEvals.get(fen) || null;
    },
    [moveEvals],
  );

  return [getEvaluation, addEvaluation];
};

export default useEvaluationCache;
