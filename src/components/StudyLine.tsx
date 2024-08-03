import { storeAttemptResult } from "@/chess/Attempt";
import { Line, getLineStatus } from "@/chess/Line";
import { Move } from "@/chess/Move";
import { Position } from "@/chess/Position";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { Engine } from "@/engine/Engine";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { ChessboardState } from "@/hooks/UseChessboardState";
import useEvaluationCache from "@/hooks/UseEvaluationCache";
import useStateWithTimeout from "@/hooks/UseStateWithTimeout";
import { useStudyData } from "@/hooks/UseStudyData";
import { pickLine } from "@/utils/LinePicker";
import { PieceSymbol, Square } from "chess.js";
import React, {
  Dispatch,
  MutableRefObject,
  SetStateAction,
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

export interface StudyLineProps {
  chessboardState: ChessboardState;
  onValidPieceDropRef: MutableRefObject<MoveValidator | null>;
  lineAndChapter: LineAndChapter | null;
  setLineAndChapter: (lineAndChapter: LineAndChapter | null) => void;
  lineIndex: number;
  setLineIndex: Dispatch<SetStateAction<number>>;
  height?: number;
}

export const StudyLine: React.FC<StudyLineProps> = ({
  chessboardState,
  onValidPieceDropRef,
  lineAndChapter,
  setLineAndChapter,
  lineIndex,
  setLineIndex,
  height,
}) => {
  const studyData = useStudyData();

  // TODO: Remove this mode
  //const [mode, setMode] = useState<"LINE" | "EXPLORE">("EXPLORE");
  const [solution, setSolution] = useState<Move | null>(null);
  const [attemptResult, setAttemptResult] = useState<boolean | null>(null);

  const [lineMoveResult, setLineMoveResult] =
    useStateWithTimeout<LineMoveResult | null>(null, 2000);

  /*
  const enterExploreMode = useCallback(() => {
    setMode("EXPLORE");
    setLineMoveResult(null);
    setSolution(null);
  }, [setLineMoveResult]);

  const enterLineMode = useCallback(() => {
    if (mode == "EXPLORE") {
      chessboardState.clearGame();

      // Recreate the original line
      if (lineAndChapter != null) {
        for (const position of lineAndChapter.line.positions.slice(
          0,
          lineIndex + 1,
        )) {
          chessboardState.setNextPosition(position, true);
        }
      }
    }
    setMode("LINE");
    setSolution(null);
  }, [lineAndChapter, lineIndex, mode, chessboardState]);
*/
  const clearLine = useCallback(() => {
    // Reset the game
    chessboardState.clearGame();
    setLineAndChapter(null);
    setLineIndex(-1);
  }, [chessboardState, setLineAndChapter, setLineIndex]);

  const initializeLine = useCallback(
    (lineAndChapter: LineAndChapter) => {
      const { line } = lineAndChapter;

      //enterLineMode();

      setLineAndChapter(lineAndChapter);
      chessboardState.setOrientation(line.orientation);

      // Initialize the first position
      chessboardState.setNextPosition(line.positions[0], true);
      setLineIndex((lineIndex: number) => lineIndex + 1);

      // If we are black, we first have to do white's move
      if (line.orientation == "b") {
        const firstPosition: Position = line.positions[1];
        chessboardState.setNextPosition(firstPosition, false);
        setLineIndex((lineIndex) => lineIndex + 1);
      }
    },
    [chessboardState, setLineAndChapter, setLineIndex],
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
    if (lineAndChapter == null) {
      throw new Error("line is null");
    }
    clearLine();
    initializeLine(lineAndChapter);
  }, [lineAndChapter, clearLine, initializeLine]);

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
          setLineIndex((lineIndex) => lineIndex + 1);
        }, OPPONENT_MOVE_DELAY);
      }
    },
    [attemptResult, chessboardState, setLineIndex],
  );

  useEffect(() => {
    const onValidPieceDrop = (
      newPosition: Position,
      sourceSquare: Square,
      targetSquare: Square,
      promoteToPiece?: PieceSymbol,
    ): boolean => {
      // Otherwise, we're in line mode.
      if (lineAndChapter == null) {
        window.alert('Please click "New Line" to start a new line.');
        return false;
      }

      // If the current board position is not the next position in the line,
      // we don't accept the move.  This can happen if the user uses
      // the left/right arrows to move around the line and then tries to move
      // when not in the latest position in the line.
      if (
        lineAndChapter.line.positions[lineIndex] !=
        chessboardState.getPosition()
      ) {
        setLineMoveResult(null);
        return false;
      }

      // Check whether the attempted move is the next move in the line.
      const nextMoveInLine: Move | null =
        lineAndChapter.line.positions[lineIndex + 1].lastMove;
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
          lineAndChapter.line.positions[lineIndex + 1],
          false,
        );

        // Since the move was correct, we move to the next position in the line
        setLineIndex((lineIndex) => lineIndex + 1);
        setLineMoveResult("CORRECT");
        setSolution(null);

        // We play the opponent's next move if the line continues.
        playOpponentNextMoveIfLineContinues(lineAndChapter.line, lineIndex + 1);

        // Return true to accept the move
        return true;
      }

      // If we got here, the move is not correct
      setLineMoveResult("INCORRECT");
      if (attemptResult == null) {
        setAttemptResult(false);
        storeAttemptResult(lineAndChapter.line, false, db.attempts);
      }
      setSolution(null);
      return false;
    };

    onValidPieceDropRef.current = onValidPieceDrop;
  }, [
    onValidPieceDropRef,
    lineAndChapter,
    lineIndex,
    chessboardState,
    setLineMoveResult,
    attemptResult,
    setLineIndex,
    playOpponentNextMoveIfLineContinues,
  ]);

  /*
  const onPieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square, piece: string): boolean => {
      const originalPiece: PieceSymbol | null =
        chessboardState.getPieceAtSquare(sourceSquare);
      if (originalPiece == null) {
        throw new Error("originalPiece is null");
      }

      const promoteToPiece = getPromoteToPiece(
        sourceSquare,
        targetSquare,
        originalPiece,
        convertToPieceSymbol(piece),
      );

      const [move, newPosition]: [Move | null, Position | null] =
        chessboardState.createMoveOrNull(
          sourceSquare,
          targetSquare,
          promoteToPiece,
        ) || [null, null];

      if (move == null || newPosition == null) {
        return false;
      }

      if (mode == "EXPLORE") {
        // In explore mode, we just make the move
        chessboardState.setNextPosition(newPosition, true);
        return true;
      }

      // Otherwise, we're in line mode.
      if (lineAndChapter == null) {
        window.alert('Please click "New Line" to start a new line.');
        return false;
      }

      // If the current board position is not the next position in the line,
      // we don't accept the move.  This can happen if the user uses
      // the left/right arrows to move around the line and then tries to move
      // when not in the latest position in the line.
      if (
        lineAndChapter.line.positions[lineIndex] !=
        chessboardState.getPosition()
      ) {
        setLineMoveResult(null);
        return false;
      }

      // Check whether the attempted move is the next move in the line.
      const nextMoveInLine: Move | null =
        lineAndChapter.line.positions[lineIndex + 1].lastMove;
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
          lineAndChapter.line.positions[lineIndex + 1],
          false,
        );

        // Since the move was correct, we move to the next position in the line
        setLineIndex((lineIndex) => lineIndex + 1);
        setLineMoveResult("CORRECT");
        setSolution(null);

        // We play the opponent's next move if the line continues.
        playOpponentNextMoveIfLineContinues(lineAndChapter.line, lineIndex + 1);

        // Return true to accept the move
        return true;
      }

      // If we got here, the move is not correct
      setLineMoveResult("INCORRECT");
      if (attemptResult == null) {
        setAttemptResult(false);
        storeAttemptResult(lineAndChapter.line, false, db.attempts);
      }
      setSolution(null);
      return false;
    },
    [
      chessboardState,
      mode,
      lineAndChapter,
      lineIndex,
      setLineMoveResult,
      attemptResult,
      setLineIndex,
      playOpponentNextMoveIfLineContinues,
    ],
  );
*/
  const toggleShowSolution = useCallback(() => {
    if (lineAndChapter == null || lineIndex == -1) {
      throw new Error("line is null");
    }

    if (solution) {
      setSolution(null);
    } else {
      const lineSolution =
        lineAndChapter.line.positions[lineIndex + 1].lastMove;
      if (lineSolution == null) {
        throw new Error("solution is null");
      }
      setSolution(lineSolution);
    }
  }, [lineAndChapter, lineIndex, solution]);

  const position = chessboardState.getPosition();

  const lineStatus = lineAndChapter
    ? getLineStatus(lineAndChapter.line, lineIndex)
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
        chapter={lineAndChapter?.chapter || undefined}
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
          // mode={mode}
          lineStatus={lineStatus}
          onNewLine={onNewLine}
          onRestartLine={onRestartLine}
          toggleShowSolution={toggleShowSolution}
          // enterExploreMode={enterExploreMode}
          //  enterLineMode={enterLineMode}
        />
      ) : null}
    </div>
  );
};
