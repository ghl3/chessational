import { Fen } from "@/chess/Fen";
import { Engine } from "@/engine/Engine";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { useCallback, useEffect, useState } from "react";

// Only run the engine on the client.
let engine: Engine | null = null;
if (typeof window !== "undefined") {
  engine = new Engine(new Worker("/stockfish/stockfish.asm.js"), 20, 3, false);
}

export interface EngineData {
  engine: Engine | null;
  runEngine: boolean;
  setRunEngine: React.Dispatch<React.SetStateAction<boolean>>;
  getEvaluation: (fen: Fen) => EvaluatedPosition | null;
  addEvaluation: (evaluatedPosition: EvaluatedPosition) => void;
}

const useEngine = (): EngineData => {
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

  useEffect(() => {
    if (engine && runEngine) {
      engine.listener = (evaluation: EvaluatedPosition) => {
        addEvaluation(evaluation);
      };
    }
  }, [runEngine, addEvaluation]);

  return {
    engine: engine,
    runEngine: runEngine,
    setRunEngine: setRunEngine,
    getEvaluation: getEvaluation,
    addEvaluation: addEvaluation,
  };
};

export default useEngine;
