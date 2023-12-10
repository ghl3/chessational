"use client";

import { Line, getLineStatus } from "@/chess/Line";
import { Move, convertToPieceSymbol, getPromoteToPiece } from "@/chess/Move";
import { Position } from "@/chess/Position";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import Chessboard, { Arrow } from "@/components/Chessboard";
import { Controls } from "@/components/Controls";
import { DetailsPanel } from "@/components/DetailsPanel";
import { LineMoveResult } from "@/components/MoveDescription";
import { StudyChapterSelector } from "@/components/StudyChapterSelector";
import { Engine } from "@/engine/Engine";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { useChessboardSize } from "@/hooks/UseChessboardSize";
import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import useStateWithTimeout from "@/hooks/UseStateWithTimeout";
import { useStudyData } from "@/hooks/UseStudyData";
import { storeAttemptResult } from "@/utils/Attempt";
import { pickLine } from "@/utils/LinePicker";
import { PieceSymbol } from "chess.js";
import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import { Square } from "react-chessboard/dist/chessboard/types";
import { db } from "./db";

const OPPONENT_MOVE_DELAY = 250;

// Only run the engine on the client.
let engine: Engine | null = null;
if (typeof window !== "undefined") {
  engine = new Engine(new Worker("/stockfish/stockfish.asm.js"), 20, 3, false);
}

const Home: React.FC = () => {
  const studyData = useStudyData();

  const [lineAndChapter, setLineAndChapter] = useState<LineAndChapter | null>(
    null,
  );
  // The current position in the line.
  // The next move to play is line.moves[lineIndex+1]
  const [lineIndex, setLineIndex] = useState<number>(-1);

  const [lineMoveResult, setLineMoveResult] =
    useStateWithTimeout<LineMoveResult | null>(null, 2000);

  const [attemptResult, setAttemptResult] = useState<boolean | null>(null);

  // When not null, the solution to show to the user.
  const [solution, setSolution] = useState<Move | null>(null);

  const chessboardSize = useChessboardSize();
  const chessboardState: ChessboardState = useChessboardState();

  const [mode, setMode] = useState<"LINE" | "EXPLORE">("LINE");

  // Set and maintain the size of the board
  const chessboardRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    if (chessboardRef.current) {
      setHeight(chessboardRef.current.clientHeight);
    }
  }, [chessboardSize]);

  // Set up the engine listener on component load
  const [positionEvaluation, setPositionEvaluation] =
    useState<EvaluatedPosition | null>(null);
  useEffect(() => {
    if (engine) {
      engine.listener = (position: EvaluatedPosition) => {
        setPositionEvaluation(position);
      };
    }
  }, []);

  const [runEngine, setRunEngine] = useState<boolean>(false);
  const onToggleShowEngine = useCallback((showEngine: boolean) => {
    setRunEngine(showEngine);
  }, []);

  // Run the engine when needed
  const fen = chessboardState.getFen();
  useEffect(() => {
    setPositionEvaluation(null);

    if (engine && runEngine && fen) {
      console.log("Canceling old position, running engine for: " + fen);
      engine.cancel();
      engine.evaluatePosition(fen).then((evaluation) => {
        console.log("Got Final Position Evaluation for: " + evaluation.fen);
        setPositionEvaluation(evaluation);
      });
    }
  }, [fen, runEngine]);

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

  const clearLine = useCallback(() => {
    // Reset the game
    chessboardState.clearGame();
    setLineAndChapter(null);
    setLineIndex(-1);
  }, [chessboardState]);

  const initializeLine = useCallback(
    (lineAndChapter: LineAndChapter) => {
      const { line, chapter } = lineAndChapter;

      enterLineMode();

      setLineAndChapter(lineAndChapter);
      chessboardState.setOrientation(line.orientation);

      // Initialize the first position
      chessboardState.setNextPosition(line.positions[0], true);
      setLineIndex((lineIndex) => lineIndex + 1);

      // If we are black, we first have to do white's move
      if (line.orientation == "b") {
        const firstPosition: Position = line.positions[1];
        chessboardState.setNextPosition(firstPosition, false);
        setLineIndex((lineIndex) => lineIndex + 1);
      }
    },
    [chessboardState, enterLineMode],
  );

  const onNewLine = useCallback(() => {
    clearLine();
    setAttemptResult(null);

    if (studyData.lines == null) {
      throw new Error("studyData.lines is null");
    }

    const line = pickLine(studyData.lines, "RANDOM");
    const chapter = studyData.chapters?.find(
      (chapter) => chapter.name == line.chapterName,
    );
    if (chapter == null) {
      throw new Error("chapter is null");
    }

    initializeLine({ line, chapter });
  }, [clearLine, initializeLine, studyData.chapters, studyData.lines]);

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
    [attemptResult, chessboardState],
  );

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
      // the left/right arrows to move around the line.
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
      playOpponentNextMoveIfLineContinues,
    ],
  );

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

  const lineStatus =
    mode == "LINE" && lineAndChapter
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

  return (
    <>
      <Head>
        <title>Chessational: Opening Review</title>
        <meta
          name="description"
          content="Enter a chess.com game ID to review"
        />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
      </Head>

      <main className="charcoal-bg text-white min-h-screen flex flex-col items-center">
        <div className="mb-6">
          <h1 className="text-4xl">Chessational: Opening Review</h1>
        </div>

        <div className="flex flex-col items-center items-start mb-6 max-w-screen-xl space-y-2">
          <StudyChapterSelector studyData={studyData} />

          <div className="flex flex-row justify-center items-start mb-6 w-screen">
            <div ref={chessboardRef}>
              <Chessboard
                chessboardSize={chessboardSize}
                chessboardState={chessboardState}
                onPieceDrop={onPieceDrop}
                className="flex-none"
                arrows={solutionArrows || []}
              />
            </div>

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
          </div>
        </div>

        {studyData.selectedStudy != null ? (
          <Controls
            mode={mode}
            lineStatus={lineStatus}
            onNewLine={onNewLine}
            onRestartLine={onRestartLine}
            toggleShowSolution={toggleShowSolution}
            enterExploreMode={enterExploreMode}
            enterLineMode={enterLineMode}
          />
        ) : null}
      </main>
    </>
  );
};

export default Home;
