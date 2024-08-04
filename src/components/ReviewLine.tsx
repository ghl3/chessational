import { storeAttemptResult } from "@/chess/Attempt";
import { Line, getLineStatus } from "@/chess/Line";
import { Move } from "@/chess/Move";
import { Position } from "@/chess/Position";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { Engine } from "@/engine/Engine";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { CurrentLineData } from "@/hooks/UseCurrentLineData";
import useEvaluationCache from "@/hooks/UseEvaluationCache";
import { ReviewState } from "@/hooks/UseReviewState";
import useStateWithTimeout from "@/hooks/UseStateWithTimeout";
import { useStudyData } from "@/hooks/UseStudyData";
import { pickLine } from "@/utils/LinePicker";
import { PieceSymbol, Square } from "chess.js";
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useState,
} from "react";
import { db } from "../app/db";
import { Arrow, MoveValidator } from "./Chessboard";
import { Controls } from "./Controls";
import { DetailsPanel } from "./DetailsPanel";
import { LineMoveResult } from "./MoveDescription";
import { StudyChapterSelector } from "./StudyChapterSelector";

const OPPONENT_MOVE_DELAY = 250;

// Only run the engine on the client.
let engine: Engine | null = null;
if (typeof window !== "undefined") {
  engine = new Engine(new Worker("/stockfish/stockfish.asm.js"), 20, 3, false);
}

export interface ReviewLineProps {
  chessboardState: ChessboardState;
  onValidPieceDropRef: MutableRefObject<MoveValidator | null>;
  //lineAndChapter: LineAndChapter | null;
  //setLineAndChapter: (lineAndChapter: LineAndChapter | null) => void;
  //lineIndex: number;
  //setLineIndex: Dispatch<SetStateAction<number>>;
  currentLineData: CurrentLineData;
  reviewState: ReviewState;
  height?: number;
}

export const ReviewLine: React.FC<ReviewLineProps> = ({
  chessboardState,
  onValidPieceDropRef,
  currentLineData,
  reviewState,
  //lineAndChapter,
  //setLineAndChapter,
  //lineIndex,
  //setLineIndex,
  height,
}) => {
  const studyData = useStudyData();

  const [solution, setSolution] = useState<Move | null>(null);
  const [attemptResult, setAttemptResult] = useState<boolean | null>(null);

  const [lineMoveResult, setLineMoveResult] =
    useStateWithTimeout<LineMoveResult | null>(null, 2000);

  const clearLine = useCallback(() => {
    // Reset the game
    chessboardState.clearGame();
    currentLineData.setLineAndChapter(null);
    currentLineData.setLineIndex(-1);
  }, [chessboardState, currentLineData]);

  const initializeLine = useCallback(
    (lineAndChapter: LineAndChapter) => {
      const { line } = lineAndChapter;

      currentLineData.setLineAndChapter(lineAndChapter);
      chessboardState.setOrientation(line.orientation);

      // Initialize the first position
      chessboardState.setNextPosition(line.positions[0], true);
      currentLineData.setLineIndex((lineIndex: number) => lineIndex + 1);

      // If we are black, we first have to do white's move
      if (line.orientation == "b") {
        const firstPosition: Position = line.positions[1];
        chessboardState.setNextPosition(firstPosition, false);
        currentLineData.setLineIndex((lineIndex) => lineIndex + 1);
      }
    },
    [chessboardState, currentLineData],
  );

  const onNewLine = useCallback(() => {
    clearLine();
    setAttemptResult(null);

    if (studyData.lines == null) {
      throw new Error("studyData.lines is null");
    }

    const line = pickLine(
      studyData.lines,
      "SPACED_REPITITION",
      studyData.attempts,
    );
    const chapter = studyData.chapters?.find(
      (chapter) => chapter.name == line.chapterName,
    );
    if (chapter == null) {
      throw new Error("chapter is null");
    }

    initializeLine({ line, chapter });
  }, [
    clearLine,
    initializeLine,
    studyData.attempts,
    studyData.chapters,
    studyData.lines,
  ]);

  const onRestartLine = useCallback(() => {
    if (currentLineData.lineAndChapter == null) {
      throw new Error("line is null");
    }
    clearLine();
    initializeLine(currentLineData.lineAndChapter);
  }, [clearLine, currentLineData.lineAndChapter, initializeLine]);

  const playOpponentNextMoveIfLineContinues = useCallback(
    (line: Line, lineIndex: number) => {
      const endOfLine = lineIndex == line.positions.length - 1;

      // If this is the end of the line, we're done.
      if (endOfLine) {
        // If we got to the end of the line without any attempt failures,
        // we mark the attempt as complete
        if (attemptResult == null) {
          setAttemptResult(true);
          storeAttemptResult(line, true, db.attempts);
        }
      } else {
        // Otherwise, pick the opponent's next move in the line
        // Do this in a delay to simulate a game.
        setTimeout(async () => {
          const nextPosition = line.positions[lineIndex + 1];
          chessboardState.setNextPosition(nextPosition, false);
          currentLineData.setLineIndex((lineIndex) => lineIndex + 1);
        }, OPPONENT_MOVE_DELAY);
      }
    },
    [attemptResult, chessboardState, currentLineData],
  );

  useEffect(() => {
    const onValidPieceDrop = (
      newPosition: Position,
      sourceSquare: Square,
      targetSquare: Square,
      promoteToPiece?: PieceSymbol,
    ): boolean => {
      // Otherwise, we're in line mode.
      if (currentLineData.lineAndChapter == null) {
        window.alert('Please click "New Line" to start a new line.');
        return false;
      }

      // If the current board position is not the next position in the line,
      // we don't accept the move.  This can happen if the user uses
      // the left/right arrows to move around the line and then tries to move
      // when not in the latest position in the line.
      if (
        currentLineData.lineAndChapter.line.positions[
          currentLineData.lineIndex
        ] != chessboardState.getPosition()
      ) {
        setLineMoveResult(null);
        return false;
      }

      // Check whether the attempted move is the next move in the line.
      const nextMoveInLine: Move | null =
        currentLineData.lineAndChapter.line.positions[
          currentLineData.lineIndex + 1
        ].lastMove;
      if (nextMoveInLine == null) {
        throw new Error("nextMoveInLine is null");
      }

      if (
        nextMoveInLine.from === sourceSquare &&
        nextMoveInLine.to === targetSquare &&
        (promoteToPiece || null) == (nextMoveInLine.promotion || null)
      ) {
        // If it matches a child node, it's an acceptable move
        // and we update the current line and the board state.
        // Note that we use line.positions[lineIndex + 1] because
        // we want to make sure to keep the comments.
        chessboardState.setNextPosition(
          currentLineData.lineAndChapter.line.positions[
            currentLineData.lineIndex + 1
          ],
          false,
        );

        // Since the move was correct, we move to the next position in the line
        currentLineData.setLineIndex((lineIndex) => lineIndex + 1);
        setLineMoveResult("CORRECT");
        setSolution(null);

        // We play the opponent's next move if the line continues.
        playOpponentNextMoveIfLineContinues(
          currentLineData.lineAndChapter.line,
          currentLineData.lineIndex + 1,
        );

        // Return true to accept the move
        return true;
      }

      // If we got here, the move is not correct
      setLineMoveResult("INCORRECT");
      if (attemptResult == null) {
        setAttemptResult(false);
        storeAttemptResult(
          currentLineData.lineAndChapter.line,
          false,
          db.attempts,
        );
      }
      setSolution(null);
      return false;
    };

    onValidPieceDropRef.current = onValidPieceDrop;
    return () => {
      onValidPieceDropRef.current = null;
    };
  }, [
    onValidPieceDropRef,
    chessboardState,
    setLineMoveResult,
    attemptResult,
    playOpponentNextMoveIfLineContinues,
    currentLineData,
  ]);

  const toggleShowSolution = useCallback(() => {
    if (
      currentLineData.lineAndChapter == null ||
      currentLineData.lineIndex == -1
    ) {
      throw new Error("line is null");
    }

    if (solution) {
      setSolution(null);
    } else {
      const lineSolution =
        currentLineData.lineAndChapter.line.positions[
          currentLineData.lineIndex + 1
        ].lastMove;
      if (lineSolution == null) {
        throw new Error("solution is null");
      }
      setSolution(lineSolution);
    }
  }, [currentLineData.lineAndChapter, currentLineData.lineIndex, solution]);

  const position = chessboardState.getPosition();

  const lineStatus = currentLineData.lineAndChapter
    ? getLineStatus(
        currentLineData.lineAndChapter.line,
        currentLineData.lineIndex,
      )
    : undefined;

  const solutionArrows: Arrow[] =
    solution != null
      ? [
          {
            from: solution.from,
            to: solution.to,
            color: "rgb(0, 100, 0)",
          },
        ]
      : [];

  const [getEvaluation, addEvaluation] = useEvaluationCache();

  const positionEvaluation = position ? getEvaluation(position.fen) : null;

  useEffect(() => {
    if (engine) {
      engine.listener = (evaluation: EvaluatedPosition) => {
        addEvaluation(evaluation);
      };
    }
  }, [addEvaluation]);

  const [runEngine, setRunEngine] = useState<boolean>(false);
  const onToggleShowEngine = useCallback((showEngine: boolean) => {
    setRunEngine(showEngine);
  }, []);

  return (
    <div>
      <StudyChapterSelector studyData={studyData} />

      <DetailsPanel
        chapter={currentLineData.lineAndChapter?.chapter || undefined}
        position={position || undefined}
        gameMoves={chessboardState.getGameMoves()}
        positionEvaluation={positionEvaluation}
        moveResult={lineMoveResult}
        lineStatus={lineStatus}
        onToggleShowEngine={onToggleShowEngine}
        height={height || 0}
      />

      {studyData.selectedStudy != null ? (
        <Controls
          lineStatus={lineStatus}
          onNewLine={onNewLine}
          onRestartLine={onRestartLine}
          toggleShowSolution={toggleShowSolution}
        />
      ) : null}
    </div>
  );
};
