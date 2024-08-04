import { Move } from "@/chess/Move";
import { Arrow } from "@/components/Chessboard";
import { LineMoveResult } from "@/components/MoveDescription";
import { Dispatch, SetStateAction, useState } from "react";
import useStateWithTimeout from "./UseStateWithTimeout";

export interface ReviewState {
  //solution: Move | null;
  //setSolution: (solution: Move | null) => void;
  showSolution: boolean;
  setShowSolution: Dispatch<SetStateAction<boolean>>;
  attemptResult: boolean | null;
  setAttemptResult: Dispatch<SetStateAction<boolean | null>>;
  lineMoveResult: LineMoveResult | null;
  setLineMoveResult: Dispatch<SetStateAction<LineMoveResult | null>>;
}

export const useReviewState = (): ReviewState => {
  //const [solution, setSolution] = useState<Move | null>(null);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  const [attemptResult, setAttemptResult] = useState<boolean | null>(null);

  const [lineMoveResult, setLineMoveResult] =
    useStateWithTimeout<LineMoveResult | null>(null, 2000);

  return {
    //solution,
    //setSolution,
    showSolution,
    setShowSolution,
    attemptResult,
    setAttemptResult,
    lineMoveResult,
    setLineMoveResult,
  };
};
