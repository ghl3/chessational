"use client";

import Chessboard from "@/components/Chessboard";
import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import { StudyChapterSelector } from "@/components/StudyChapterSelector";
import { Controls } from "@/components/Controls";
import { Square } from "react-chessboard/dist/chessboard/types";
import { Chess, Move as MoveResult } from "chess.js";
import DescriptionArea from "@/components/DescriptionArea";
import { useStudyData } from "@/hooks/UseStudyData";
import { Study } from "@/chess/Study";
import { Chapter, MoveNode } from "@/chess/Chapter";
import { Move } from "@/chess/Move";
import { getGameResult } from "@/chess/PgnParser";
import { Engine } from "@/engine/Engine";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { PositionEvaluation } from "@/components/PositionEvaluation";
import { Database } from "@/components/Database";
import { Line, getLineStatus, pickLine } from "@/chess/Line";
import { LineMoveResult } from "@/components/MoveDescription";

const OPPONENT_MOVE_DELAY = 250;

// Only run the engine on the client.
let engine: Engine | null = null;
if (typeof window !== "undefined") {
  engine = new Engine(new Worker("/stockfish/stockfish.asm.js"), 18, 3, false);
}

// This does NOT update the chess object.
const createMoveOrNull = (
  chess: Chess,
  sourceSquare: Square,
  targetSquare: Square
): Move | null => {
  try {
    const moveResult = chess.move({
      from: sourceSquare,
      to: targetSquare,
    });

    if (moveResult == null) {
      return null;
    } else {
      const move: Move = {
        move: moveResult.san,
        piece: moveResult.piece,
        from: moveResult.from,
        to: moveResult.to,
        player: moveResult.color,
        fen: chess.fen(),
        isGameOver: chess.isGameOver(),
        gameResult: getGameResult(chess),
      };
      chess.undo();
      return move;
    }
  } catch (error) {
    console.log("Invalid Move:", error);
    return null;
  }
};

const Home: React.FC = () => {
  const studyData = useStudyData();
  useEffect(studyData.populateCachedValues, []);

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

  // Set the latest move in the line
  const [moves, setMoves] = useState<Move[]>([]);
  const [line, setLine] = useState<Line | null>(null);

  const [moveResult, setMoveResult] = useState<LineMoveResult | null>(null);
  //const [lineState, setLineState] = useState<LineState | null>(null);

  // The line index is the index of the next move to play.
  const [lineIndex, setLineIndex] = useState<number>(-1);

  const selectedStudy: Study | undefined = studyData.studies.find(
    (study) => study.name == studyData.selectedStudyName
  );

  const selectedChapters: Chapter[] | undefined =
    selectedStudy?.chapters.filter((chapter) =>
      studyData.selectedChapterNames.includes(chapter.name)
    );

  const chessboardState: ChessboardState = useChessboardState();

  const [exploreMode, setExploreMode] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [showEngine, setShowEngine] = useState<boolean>(false);
  const [showDatabase, setShowDatabase] = useState<boolean>(false);

  let gameObject = useRef<Chess>(new Chess());

  const randomlyPickChapter = (chapters: Chapter[]): Chapter => {
    if (selectedChapters == null) {
      throw new Error("selectedChapters is null");
    }

    const chapterIndex = Math.floor(Math.random() * selectedChapters.length);
    return selectedChapters[chapterIndex];
  };

  const toggleEngine = useCallback(() => {
    setShowEngine(!showEngine);

    if (engine && showEngine) {
      engine.cancel();
      setPositionEvaluation(null);
      engine
        .evaluatePosition(gameObject.current.fen())
        .then(setPositionEvaluation);
    }
  }, [showEngine]);

  const toggleDatabase = useCallback(() => {
    setShowDatabase(!showDatabase);
  }, [showDatabase]);

  // Apply a move.  The move must be a valid move or an
  // error will be thrown.
  const applyMove = useCallback(
    (chess: Chess, move: Move): void => {
      // Throws an error if the move is invalid
      chess.move(move);

      // Update the history of moves
      setMoves((moves) => [...moves, move]);
      // Update the state of the shown board
      chessboardState.move(move, false);

      // If we're in engine mode, start processing the new board state
      if (engine && showEngine) {
        engine.cancel();
        setPositionEvaluation(null);
        engine
          .evaluatePosition(gameObject.current.fen())
          .then(setPositionEvaluation);
      }
    },
    [chessboardState]
  );

  const onNewLine = useCallback(() => {
    // Reset the game
    chessboardState.clearGame();
    gameObject.current = new Chess();
    setLine(null);
    setLineIndex(-1);
    setExploreMode(false);

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
    const line = pickLine(selectedChapters);
    setLine(line);
    chessboardState.setOrientation(line.chapter.orientation);

    // If we are black, we first have to do white's move
    if (line.chapter.orientation == "b") {
      applyMove(gameObject.current, line.moves[0]);
      setLineIndex(1);
    } else {
      setLineIndex(0);
    }
  }, [chessboardState, selectedStudy, selectedChapters]);

  const playOpponentNextMoveIfLineContinues = (
    line: Line,
    lineIndex: number
  ) => {
    const endOfLine = lineIndex >= line.moves.length - 1;

    // If this is the end of the line, we're done.
    if (!endOfLine) {
      // Otherwise, pick the opponent's next move in the line
      // Do this in a delay to simulate a game.
      setTimeout(async () => {
        const nextMove = line.moves[lineIndex];
        applyMove(gameObject.current, nextMove);
        setLineIndex(lineIndex + 1);
      }, OPPONENT_MOVE_DELAY);
    }
  };

  const onPieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square): boolean => {
      // Determine if it's a valid move.
      // This does NOT update the gameObject
      const move: Move | null = createMoveOrNull(
        gameObject.current,
        sourceSquare,
        targetSquare
      );

      if (move == null) {
        return false;
      }

      if (exploreMode) {
        // In explore mode, we just make the move
        // TODO: In the chessboard state, when making a move, we need
        // the ability to go back and change, and then that becomes the current line.
        applyMove(gameObject.current, move);
        return true;
      }

      // Otherwise, we're in line mode.
      if (line == null) {
        window.alert('Please click "New Line" to start a new line.');
        return false;
      }

      // Check whether the attempted move is the next move in the line.
      //for (const nextMoveInLine of line.children) {
      const nextMoveInLine = line.moves[lineIndex];
      if (
        nextMoveInLine.from === sourceSquare &&
        nextMoveInLine.to === targetSquare
      ) {
        // If it matches a child node, it's an acceptable move
        // and we update the current line and the board state.
        applyMove(gameObject.current, move);
        playOpponentNextMoveIfLineContinues(line, lineIndex + 1);
        setLineIndex(lineIndex + 1);
        setMoveResult("CORRECT");
        // Return true to accept the move
        return true;
      }

      // If we got here, the move is not correct
      //setLineState({ result: "INCORRECT", status: "SELECT_MOVE_FOR_WHITE" });
      setMoveResult("INCORRECT");
      return false;
    },
    [moves, line, chessboardState, exploreMode]
  );

  const onShowComments = useCallback(() => {
    setShowComments((showComments) => !showComments);
  }, []);

  const toggleExploreMode = useCallback(() => {
    if (exploreMode) {
      // If we're in explore mode, we return to the current line
      setExploreMode(false);

      // Recreate the original line
      chessboardState.clearGame();
      for (const move of moves) {
        chessboardState.move(move, true);
      }
      if (chessboardState.moves.length > 0) {
        gameObject.current.load(
          chessboardState.moves[chessboardState.moves.length - 1].fen
        );
      }
    } else {
      setExploreMode(true);
    }
  }, [line, exploreMode, chessboardState]);

  const onShowSolution = useCallback(() => {
    if (line == null) {
      throw new Error("line is null");
    }

    const bestMove = line.moves[lineIndex];

    if (bestMove == null) {
      throw new Error("bestMove is null");
    }

    setTimeout(async () => {
      applyMove(gameObject.current, bestMove);
      playOpponentNextMoveIfLineContinues(line, lineIndex + 1);
    }, OPPONENT_MOVE_DELAY);
  }, [line]);

  // TODO: This is a hack.  Fix.
  const isMoveNode = (line: any): line is MoveNode => {
    return line && "children" in line && "move" in line;
  };

  let comments: string[] = [];
  if (isMoveNode(line)) {
    comments = line.comments || [];
  }

  const lineStatus = line ? getLineStatus(line, lineIndex) : undefined;

  return (
    <>
      <Head>
        <title>Opening Learner</title>
        <meta
          name="description"
          content="Enter a chess.com game ID to review"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="charcoal-bg text-white min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl mb-6">Opening Learner</h1>
        <div className="flex flex-col items-center space-y-6">
          <StudyChapterSelector studyData={studyData} />
          <div className="flex items-start w-full max-w-screen-xl">
            <Chessboard
              chessboardState={chessboardState}
              onPieceDrop={onPieceDrop}
              className="flex-none"
            />
            <div className="flex flex-col ml-6 space-y-6">
              <PositionEvaluation
                showEngine={showEngine}
                positionEvaluation={positionEvaluation || undefined}
              />
              <Database
                showDatabase={showDatabase}
                position={gameObject.current.fen()}
              />
              <div
                className="bg-gray-800 p-4 overflow-hidden whitespace-normal"
                style={{ height: chessboardState.boardSize }}
              >
                <DescriptionArea
                  move={moves[moves.length - 1]}
                  moveResult={moveResult || undefined}
                  lineStatus={lineStatus}
                  comments={comments}
                  showComments={showComments}
                />
              </div>
            </div>
          </div>
          <Controls
            onNewLine={onNewLine}
            onShowComments={onShowComments}
            onShowSolution={onShowSolution}
            exploreMode={exploreMode}
            toggleExploreMode={toggleExploreMode}
            engineIsEnabled={showEngine}
            toggleEngine={toggleEngine}
            databaseIsEnabled={showDatabase}
            toggleDatabase={toggleDatabase}
          />
        </div>
      </main>
    </>
  );
};

export default Home;
