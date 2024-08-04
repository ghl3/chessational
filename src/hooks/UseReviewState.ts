import { LineMoveResult } from "@/components/MoveDescription";
import { Dispatch, SetStateAction, useState } from "react";
import useStateWithTimeout from "./UseStateWithTimeout";

export interface ReviewState {
  showSolution: boolean;
  setShowSolution: Dispatch<SetStateAction<boolean>>;
  attemptResult: boolean | null;
  setAttemptResult: Dispatch<SetStateAction<boolean | null>>;
  lineMoveResult: LineMoveResult | null;
  setLineMoveResult: Dispatch<SetStateAction<LineMoveResult | null>>;
}

export const useReviewState = (): ReviewState => {
  const [showSolution, setShowSolution] = useState<boolean>(false);

  const [attemptResult, setAttemptResult] = useState<boolean | null>(null);

  const [lineMoveResult, setLineMoveResult] =
    useStateWithTimeout<LineMoveResult | null>(null, 2000);

  return {
    showSolution,
    setShowSolution,
    attemptResult,
    setAttemptResult,
    lineMoveResult,
    setLineMoveResult,
  };
};
