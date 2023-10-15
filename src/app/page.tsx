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
import { LineState } from "@/components/MoveDescription";
import { useStudyData } from "@/hooks/UseStudyData";
import { Study } from "@/chess/Study";
import { Chapter, LineNode, MoveNode } from "@/chess/Chapter";
import { Move } from "@/chess/Move";
import { getGameResult } from "@/chess/PgnParser";
import { Engine } from "@/engine/Engine";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { PositionEvaluation } from "@/components/PositionEvaluation";

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
  const [line, setLine] = useState<LineNode | null>(null);
  const [lineState, setLineState] = useState<LineState>({});

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

  const pickAndApplyMove = (chess: Chess, moveNodes: MoveNode[]): MoveNode => {
    const moveIndex = Math.floor(Math.random() * moveNodes.length);
    const nextMoveNode = moveNodes[moveIndex];
    applyMove(chess, nextMoveNode);
    return nextMoveNode;
  };

  const onNewLine = useCallback(() => {
    // Reset the game
    chessboardState.clearGame();
    gameObject.current = new Chess();
    setLine(null);
    setLineState({});
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

    const chapter: Chapter = randomlyPickChapter(selectedChapters);

    chessboardState.setOrientation(chapter.orientation);

    // If we are black, we first have to do white's move
    if (chapter.orientation == "b") {
      const newLine = pickAndApplyMove(
        gameObject.current,
        chapter.moveTree.children
      );
      setLine(newLine);
      setLineState({ status: "SELECT_MOVE_FOR_BLACK" });
    } else {
      setLine(chapter.moveTree);
      setLineState({ status: "SELECT_MOVE_FOR_WHITE" });
    }
  }, [studyData, chessboardState, selectedChapters]);

  const playOpponentNextMoveIfLineContinues = (line: MoveNode) => {
    // Line is over if either if either it has no children
    // or if any of the children have no children.
    // (Why "if any of the children have no children"?  Because
    // we want to avoid lines that end on the opponent's move).
    const endOfLine =
      line.children.length == 0 ||
      line.children.some((child) => child.children.length == 0);

    // If this is the end of the line, we're done.
    if (endOfLine) {
      setLineState({
        result: "CORRECT",
        status: "LINE_COMPLETE",
      });
    } else {
      setLineState({
        result: "CORRECT",
        status:
          line.player == "w"
            ? "SELECT_MOVE_FOR_BLACK"
            : "SELECT_MOVE_FOR_WHITE",
      });
      // Otherwise, pick the opponent's next move in the line
      // Do this in a delay to simulate a game.
      setTimeout(async () => {
        const newLine = pickAndApplyMove(gameObject.current, line.children);
        setLine(newLine);
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
      }

      // Otherwise, we're in line mode.
      if (line == null) {
        throw new Error("Line is null");
      }

      // Check whether the attempted move is one of the acceptable
      // moves in the line.
      for (const nextMoveInLine of line.children) {
        if (
          nextMoveInLine.from === sourceSquare &&
          nextMoveInLine.to === targetSquare
        ) {
          // If it matches a child node, it's an acceptable move
          // and we update the current line and the board state.
          applyMove(gameObject.current, move);
          setLine(nextMoveInLine);
          playOpponentNextMoveIfLineContinues(nextMoveInLine);
          // Return true to accept the move
          return true;
        }
      }

      // If we got here, the move is not correct
      setLineState({ result: "INCORRECT", status: "SELECT_MOVE_FOR_WHITE" });
      return false;
    },
    [moves, line, chessboardState, exploreMode]
  );

  const onShowComments = useCallback(() => {
    setShowComments(true);
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
    const bestMove = line?.children[0];

    if (bestMove == null) {
      throw new Error("bestMove is null");
    }

    setTimeout(async () => {
      applyMove(gameObject.current, bestMove);
      playOpponentNextMoveIfLineContinues(bestMove);
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
          <div
            className="flex items-start space-x-6 w-full max-w-screen-xl"
            style={{ width: `calc(${chessboardState.boardSize}px + 30%)` }}
          >
            <Chessboard
              chessboardState={chessboardState}
              onPieceDrop={onPieceDrop}
              className="flex-none"
            />
            <PositionEvaluation
              showEngine={showEngine}
              positionEvaluation={positionEvaluation || undefined}
            />
            <div
              className="flex-none ml-6 bg-gray-800 p-4 overflow-hidden whitespace-normal"
              style={{ height: chessboardState.boardSize }}
            >
              <DescriptionArea
                result={lineState}
                comments={comments}
                showComments={showComments}
              />
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
          />
        </div>
      </main>
    </>
  );
};

export default Home;
