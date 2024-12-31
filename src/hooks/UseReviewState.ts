import { getLineStatus, LineStatus } from "@/chess/Line";
import { Position } from "@/chess/Position";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { LineMoveResult } from "@/components/MoveDescription";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { ChessboardState } from "./UseChessboardState";
import useStateWithTimeout from "./UseStateWithTimeout";

export interface ReviewState {
  lineAndChapter: LineAndChapter | null;
  lineIndex: number;
  lineStatus: LineStatus | undefined;

  setLineAndChapter: (
    lineAndChapter: LineAndChapter | null,
    chessboardState: ChessboardState,
  ) => void;
  setLineIndex: Dispatch<SetStateAction<number>>;
  initializeLine: (
    lineAndChapter: LineAndChapter,
    chessboardState: ChessboardState,
  ) => void;
  clearLine: (chessboardState: ChessboardState) => void;

  showSolution: boolean;
  setShowSolution: Dispatch<SetStateAction<boolean>>;
  attemptResult: boolean | null;
  setAttemptResult: Dispatch<SetStateAction<boolean | null>>;
  lineMoveResult: LineMoveResult | null;
  setLineMoveResult: Dispatch<SetStateAction<LineMoveResult | null>>;
}

export const useReviewState = (): ReviewState => {
  // The currently selected line
  const [currentLineAndChapter, setCurrentLineAndChapter] =
    useState<LineAndChapter | null>(null);

  // The current position in the line.
  // The next move to play is line.moves[lineIndex+1]
  // Note that this is independent of the position on the board
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);

  const lineStatus = useMemo(() => {
    return currentLineAndChapter
      ? getLineStatus(currentLineAndChapter.line, currentLineIndex)
      : undefined;
  }, [currentLineAndChapter, currentLineIndex]);

  const [showSolution, setShowSolution] = useState<boolean>(false);

  const [attemptResult, setAttemptResult] = useState<boolean | null>(null);

  const [lineMoveResult, setLineMoveResult] =
    useStateWithTimeout<LineMoveResult | null>(null, 2000);

  const setLineAndChapterWithDefaults = (
    lineAndChapter: LineAndChapter | null,
  ) => {
    setCurrentLineAndChapter(lineAndChapter);
    setCurrentLineIndex(-1);
  };

  const clearLine = useCallback(
    (chessboardState: ChessboardState) => {
      chessboardState.clearGame();
      setCurrentLineAndChapter(null);
      setCurrentLineIndex(-1);
      setAttemptResult(null);
      setShowSolution(false);
      setLineMoveResult(null);
    },
    [
      setCurrentLineAndChapter,
      setCurrentLineIndex,
      setAttemptResult,
      setShowSolution,
      setLineMoveResult,
    ],
  );

  const initializeLine = useCallback(
    (lineAndChapter: LineAndChapter, chessboardState: ChessboardState) => {
      const { line } = lineAndChapter;

      setCurrentLineAndChapter(lineAndChapter);
      chessboardState.setOrientation(line.orientation);

      // Initialize the first position
      chessboardState.setNextPosition(line.positions[0], true);
      setCurrentLineIndex((lineIndex: number) => lineIndex + 1);

      // If we are black, we first have to do white's move
      if (line.orientation == "b") {
        const firstPosition: Position = line.positions[1];
        chessboardState.setNextPosition(firstPosition, false);
        setCurrentLineIndex((lineIndex) => lineIndex + 1);
      }
    },
    [setCurrentLineAndChapter, setCurrentLineIndex],
  );

  return {
    lineAndChapter: currentLineAndChapter,
    setLineAndChapter: setLineAndChapterWithDefaults,
    lineIndex: currentLineIndex,
    setLineIndex: setCurrentLineIndex,
    lineStatus,

    clearLine,
    initializeLine,

    showSolution,
    setShowSolution,
    attemptResult,
    setAttemptResult,
    lineMoveResult,
    setLineMoveResult,
  };
};
