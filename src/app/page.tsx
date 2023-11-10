"use client";

import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import { StudyChapterSelector } from "@/components/StudyChapterSelector";
import { Controls } from "@/components/Controls";
import { Square } from "react-chessboard/dist/chessboard/types";
import { useStudyData } from "@/hooks/UseStudyData";
import { Study } from "@/chess/Study";
import { Chapter } from "@/chess/Chapter";
import { Move, convertToPieceSymbol, getPromoteToPiece } from "@/chess/Move";
import { Engine } from "@/engine/Engine";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { Line, getLineStatus } from "@/chess/Line";
import { LineMoveResult } from "@/components/MoveDescription";
import { DetailsPanel } from "@/components/DetailsPanel";
import Chessboard, { Arrow } from "@/components/Chessboard";
import { pickLine } from "@/utils/LinePicker";
import useStateWithTimeout from "@/hooks/UseStateWithTimeout";
import { Position } from "@/chess/Position";
import { PieceSymbol } from "chess.js";
import { useChessboardSize } from "@/hooks/UseChessboardSize";

const OPPONENT_MOVE_DELAY = 250;

// Only run the engine on the client.
let engine: Engine | null = null;
if (typeof window !== "undefined") {
  engine = new Engine(new Worker("/stockfish/stockfish.asm.js"), 20, 3, false);
}

const Home: React.FC = () => {
  const studyData = useStudyData();
  useEffect(() => studyData.populateCachedValues());

  const [line, setLine] = useState<Line | null>(null);
  // The current position in the line.
  // The next move to play is line.moves[lineIndex+1]
  const [lineIndex, setLineIndex] = useState<number>(-1);

  const [lineMoveResult, setLineMoveResult] =
    useStateWithTimeout<LineMoveResult | null>(null, 2000);

  // When not null, the solution to show to the user.
  const [solution, setSolution] = useState<Move | null>(null);

  const selectedStudy: Study | undefined = studyData.studies.find(
    (study) => study.name == studyData.selectedStudyName
  );

  const selectedChapters: Chapter[] | undefined =
    selectedStudy?.chapters.filter((chapter) =>
      studyData.selectedChapterNames.includes(chapter.name)
    );

  const chessboardSize = useChessboardSize();
  const chessboardState: ChessboardState = useChessboardState();

  const [mode, setMode] = useState<"LINE" | "EXPLORE">("LINE");

  // Set up the engine
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

  // Set and maintain the size of the board
  const chessboardRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    if (chessboardRef.current) {
      setHeight(chessboardRef.current.clientHeight);
    }
  }, [chessboardSize]);

  // Run the engine when needed
  const fen = chessboardState.getFen();
  useEffect(() => {
    setPositionEvaluation(null);

    if (engine && runEngine && fen) {
      engine.cancel();
      engine.evaluatePosition(fen).then(setPositionEvaluation);
    }
  }, [fen, runEngine]);

  const onNewLine = useCallback(() => {
    // Reset the game
    chessboardState.clearGame();
    setLine(null);
    setLineIndex(-1);

    if (selectedStudy == null) {
      throw new Error("study is null");
    }

    if (selectedChapters == null) {
      throw new Error("selectedChapters is null");
    }

    // TODO: Make this into a nicer dialog
    if (selectedChapters.length == 0) {
      throw new Error("selectedChapters is empty");
    }

    // Pick the line
    const line = pickLine(selectedChapters, "LINE_WEIGHTED");
    setLine(line);
    chessboardState.setOrientation(line.chapter.orientation);

    // Initialize the first position
    chessboardState.setNextPosition(line.positions[0], true);
    setLineIndex((lineIndex) => lineIndex + 1);

    // If we are black, we first have to do white's move
    if (line.chapter.orientation == "b") {
      const firstPosition: Position = line.positions[1];
      chessboardState.setNextPosition(firstPosition, false);
      setLineIndex((lineIndex) => lineIndex + 1);
    }
  }, [chessboardState, selectedStudy, selectedChapters]);

  const playOpponentNextMoveIfLineContinues = useCallback(
    (line: Line, lineIndex: number) => {
      const endOfLine = lineIndex == line.positions.length - 1;

      // If this is the end of the line, we're done.
      if (!endOfLine) {
        // Otherwise, pick the opponent's next move in the line
        // Do this in a delay to simulate a game.
        setTimeout(async () => {
          const nextPosition = line.positions[lineIndex + 1];
          chessboardState.setNextPosition(nextPosition, false);
          setLineIndex((lineIndex) => lineIndex + 1);
        }, OPPONENT_MOVE_DELAY);
      }
    },
    [chessboardState]
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
        convertToPieceSymbol(piece)
      );

      const [move, newPosition]: [Move | null, Position | null] =
        chessboardState.createMoveOrNull(
          sourceSquare,
          targetSquare,
          promoteToPiece
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
      if (line == null) {
        window.alert('Please click "New Line" to start a new line.');
        return false;
      }

      // If the current board position is not the next position in the line,
      // we don't accept the move.  This can happen if the user uses
      // the left/right arrows to move around the line.
      if (line.positions[lineIndex] != chessboardState.getPosition()) {
        setLineMoveResult(null);
        return false;
      }

      // Check whether the attempted move is the next move in the line.
      const nextMoveInLine: Move | null =
        line.positions[lineIndex + 1].lastMove;
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
        chessboardState.setNextPosition(line.positions[lineIndex + 1], false);

        // Since the move was correct, we move to the next position in the line
        setLineIndex((lineIndex) => lineIndex + 1);
        setLineMoveResult("CORRECT");
        setSolution(null);

        // We play the opponent's next move if the line continues.
        playOpponentNextMoveIfLineContinues(line, lineIndex + 1);

        // Return true to accept the move
        return true;
      }

      // If we got here, the move is not correct
      setLineMoveResult("INCORRECT");
      setSolution(null);
      return false;
    },
    [
      line,
      lineIndex,
      chessboardState,
      mode,
      playOpponentNextMoveIfLineContinues,
      setLineMoveResult,
    ]
  );

  const enterExploreMode = () => {
    setMode("EXPLORE");
    setLineMoveResult(null);
    setSolution(null);
  };

  const enterLineMode = useCallback(() => {
    if (mode == "EXPLORE") {
      chessboardState.clearGame();

      // Recreate the original line
      if (line != null) {
        for (const position of line.positions.slice(0, lineIndex + 1)) {
          chessboardState.setNextPosition(position, true);
        }
      }
    }
    setMode("LINE");
    setSolution(null);
  }, [line, lineIndex, mode, chessboardState]);

  const onShowSolution = useCallback(() => {
    if (line == null || lineIndex == -1) {
      throw new Error("line is null");
    }

    const lineSolution = line.positions[lineIndex + 1].lastMove;
    if (lineSolution == null) {
      throw new Error("solution is null");
    }

    setSolution(lineSolution);
  }, [line, lineIndex]);

  const position = chessboardState.getPosition();

  const lineStatus =
    mode == "LINE" && line ? getLineStatus(line, lineIndex) : undefined;

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

        <div className="mb-6">
          <StudyChapterSelector studyData={studyData} />
        </div>

        <div className="flex justify-center items-start mb-6 w-full max-w-screen-xl">
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
              chapter={line?.chapter}
              position={position || undefined}
              positionEvaluation={positionEvaluation}
              moveResult={lineMoveResult}
              lineStatus={lineStatus}
              onToggleShowEngine={onToggleShowEngine}
              height={height || 0}
            />
          </div>
        </div>

        <div className="mb-6">
          <Controls
            mode={mode}
            lineStatus={lineStatus}
            onNewLine={onNewLine}
            onShowSolution={onShowSolution}
            enterExploreMode={enterExploreMode}
            enterLineMode={enterLineMode}
          />
        </div>
      </main>
    </>
  );
};

export default Home;
