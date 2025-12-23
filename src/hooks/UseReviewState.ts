import { getLineStatus, LineStatus } from "@/chess/Line";
import { Position } from "@/chess/Position";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { LineMoveResult } from "@/components/MoveDescription";
import { BLACK, Color, WHITE } from "chess.js";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import useStateWithTimeout from "./UseStateWithTimeout";

export interface ReviewState {
  lineAndChapter: LineAndChapter | null;
  lineIndex: number;
  lineStatus: LineStatus | undefined;

  // Setters for review state only (no board manipulation)
  setLineAndChapter: (lineAndChapter: LineAndChapter | null) => void;
  setLineIndex: Dispatch<SetStateAction<number>>;
  initializeLine: (lineAndChapter: LineAndChapter) => void;
  clearLine: () => void;

  // Getters for board initialization (caller updates board)
  getLinePositions: () => Position[];
  getLineOrientation: () => Color;
  getInitialLineIndex: () => number;

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

  const setLineAndChapterWithDefaults = useCallback(
    (lineAndChapter: LineAndChapter | null) => {
      setCurrentLineAndChapter(lineAndChapter);
      setCurrentLineIndex(-1);
    },
    [],
  );

  const clearLine = useCallback(() => {
    setCurrentLineAndChapter(null);
    setCurrentLineIndex(-1);
    setAttemptResult(null);
    setShowSolution(false);
    setLineMoveResult(null);
  }, [setLineMoveResult]);

  const initializeLine = useCallback((lineAndChapter: LineAndChapter) => {
    const { line } = lineAndChapter;
    setCurrentLineAndChapter(lineAndChapter);
    setAttemptResult(null);
    setShowSolution(false);
    setLineMoveResult(null);
    
    // Set the initial line index based on orientation
    // If black, we start at index 1 (after white's first move)
    if (line.orientation === BLACK && line.positions.length > 1) {
      setCurrentLineIndex(1);
    } else {
      setCurrentLineIndex(0);
    }
  }, [setLineMoveResult]);

  // Getters for board initialization - caller updates board separately
  const getLinePositions = useCallback((): Position[] => {
    return currentLineAndChapter?.line.positions ?? [];
  }, [currentLineAndChapter]);

  const getLineOrientation = useCallback((): Color => {
    return currentLineAndChapter?.line.orientation ?? WHITE;
  }, [currentLineAndChapter]);

  const getInitialLineIndex = useCallback((): number => {
    if (!currentLineAndChapter) return 0;
    const { line } = currentLineAndChapter;
    // If black, start at index 1 (after white's first move)
    if (line.orientation === BLACK && line.positions.length > 1) {
      return 1;
    }
    return 0;
  }, [currentLineAndChapter]);

  return {
    lineAndChapter: currentLineAndChapter,
    setLineAndChapter: setLineAndChapterWithDefaults,
    lineIndex: currentLineIndex,
    setLineIndex: setCurrentLineIndex,
    lineStatus,

    clearLine,
    initializeLine,

    // Getters for board initialization
    getLinePositions,
    getLineOrientation,
    getInitialLineIndex,

    showSolution,
    setShowSolution,
    attemptResult,
    setAttemptResult,
    lineMoveResult,
    setLineMoveResult,
  };
};
