import { Move } from "@/chess/Move";
import { LineMoveResult } from "@/components/MoveDescription";
import { Dispatch, SetStateAction, useState } from "react";
import useStateWithTimeout from "./UseStateWithTimeout";

export interface ReviewState {
  solution: Move | null;
  setSolution: Dispatch<SetStateAction<Move | null>>;
  attemptResult: boolean | null;
  setAttemptResult: Dispatch<SetStateAction<boolean | null>>;
  lineMoveResult: LineMoveResult | null;
  setLineMoveResult: Dispatch<SetStateAction<LineMoveResult | null>>;
}

export const useReviewState = (): ReviewState => {
  const [solution, setSolution] = useState<Move | null>(null);
  const [attemptResult, setAttemptResult] = useState<boolean | null>(null);

  const [lineMoveResult, setLineMoveResult] =
    useStateWithTimeout<LineMoveResult | null>(null, 2000);

  return {
    solution,
    setSolution,
    attemptResult,
    setAttemptResult,
    lineMoveResult,
    setLineMoveResult,
  };
};
