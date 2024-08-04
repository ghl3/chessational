import { Fen } from "@/chess/Fen";
import { Engine } from "@/engine/Engine";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { useCallback, useEffect, useState } from "react";

export interface EngineData {
  engine: Engine | null;
  setEngine: (engine: Engine) => void;
  runEngine: boolean;
  setRunEngine: React.Dispatch<React.SetStateAction<boolean>>;
  getEvaluation: (fen: Fen) => EvaluatedPosition | null;
  addEvaluation: (evaluatedPosition: EvaluatedPosition) => void;
  hasEvaluation: (fen: Fen) => boolean;
}

const useEngine = (): EngineData => {
  const [engine, setEngine] = useState<Engine | null>(null);

  const [runEngine, setRunEngine] = useState<boolean>(false);

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

  const setEngineAndBeginListening = useCallback(
    (engine: Engine) => {
      setEngine(engine);
      engine.listener = (evaluation: EvaluatedPosition) => {
        addEvaluation(evaluation);
      };
    },
    [addEvaluation],
  );

  const hasEvaluation = useCallback(
    (fen: Fen) => {
      return moveEvals.has(fen);
    },
    [moveEvals],
  );

  // TODO: Pass in the engine evaluation and use it
  //const positionEvaluation = position ? getEvaluation(position.fen) : null;
  //const positionEvaluation: EvaluatedPosition | null = null;

  return {
    engine: engine,
    setEngine: setEngineAndBeginListening,
    runEngine: runEngine,
    setRunEngine: setRunEngine,
    getEvaluation: getEvaluation,
    addEvaluation: addEvaluation,
    hasEvaluation: hasEvaluation,
  };
};

export default useEngine;
