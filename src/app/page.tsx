"use client";

import Chessboard from "@/components/Chessboard";
import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import Head from "next/head";
import { useCallback, useRef, useState } from "react";
import { StudyChapterSelector } from "@/components/StudyChapterSelector";
import { Controls } from "@/components/Controls";
import { MoveNode } from "@/chess/PgnTree";
import { Square } from "react-chessboard/dist/chessboard/types";
import { Chess, Move as MoveResult } from "chess.js";
import DescriptionArea from "@/components/DescriptionArea";
import { LineResult } from "@/components/MoveDescription";
import { Chapter, Study, useStudyData } from "@/hooks/UseStudyData";

const OPPONENT_MOVE_DELAY = 250;

const Home: React.FC = () => {
  const studyData = useStudyData();

  const selectedStudy: Study | undefined = studyData.studies.find(
    (study) => study.name == studyData.selectedStudyName
  );

  const selectedChapters: Chapter[] | undefined =
    selectedStudy?.chapters.filter((chapter) =>
      studyData.selectedChapterNames.includes(chapter.name)
    );

  const [lastMoveResult, setLastMoveResult] = useState<LineResult>("Unknown");

  const chessboardState: ChessboardState = useChessboardState();

  const [showComments, setShowComments] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  // Set the latest move in the line
  const [line, setLine] = useState<MoveNode | null>(null);

  let gameObject = useRef<Chess>(new Chess());

  const selectChapter = (): Chapter => {
    if (selectedChapters == null) {
      throw new Error("selectedChapters is null");
    }

    const chapterIndex = Math.floor(Math.random() * selectedChapters.length);
    return selectedChapters[chapterIndex];
  };

  const applyMove = (move: MoveNode) => {
    const moveResult = moveOrNull(move.from, move.to);
    if (moveResult == null) {
      throw new Error("Move is null");
    }
    setLine(move);
    chessboardState.addMove(move);
  };

  const pickAndApplyMove = (moveNodes: MoveNode[]) => {
    const moveIndex = Math.floor(Math.random() * moveNodes.length);
    const nextMoveNode = moveNodes[moveIndex];

    applyMove(nextMoveNode);
  };

  const onNewLine = useCallback(() => {
    // Reset the game
    gameObject.current = new Chess();
    setLine(null);
    setLastMoveResult("Unknown");

    if (selectedStudy == null) {
      throw new Error("study is null");
    }

    const chapter: Chapter = selectChapter();

    chessboardState.setOrientation(
      chapter.tree.orientation == "w" ? "white" : "black"
    );

    // If we are black, we first have to do white's move
    if (chapter.tree.orientation == "b") {
      pickAndApplyMove(chapter.tree.moveTree);
    }
  }, [studyData, chessboardState]);

  const moveOrNull = (
    sourceSquare: Square,
    targetSquare: Square
  ): MoveResult | null => {
    try {
      return gameObject.current.move({
        from: sourceSquare,
        to: targetSquare,
      });
    } catch (error) {
      console.error("Invalid Move:", error);
      return null;
    }
  };

  const playOpponentNextMoveIfLineContinues = (line: MoveNode) => {
    // If this is the end of the line, we're done.
    if (line.children.length == 0) {
      setLastMoveResult("Line Complete");
    } else {
      setLastMoveResult("Correct");
      // Otherwise, pick the opponent's next move in the line
      // Do this in a delay to simulate a game.
      setTimeout(async () => {
        pickAndApplyMove(line.children);
      }, OPPONENT_MOVE_DELAY);
    }
  };

  const onPieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square): boolean => {
      if (line == null) {
        throw new Error("Line is null");
      }

      // Check that it's a valid move
      const moveResult = moveOrNull(sourceSquare, targetSquare);
      if (moveResult == null) {
        return false;
      }

      // Check whether the attempted move is one of the acceptable
      // moves in the line.
      for (const move of line.children) {
        if (move.from === sourceSquare && move.to === targetSquare) {
          // If it matches a child node, it's an acceptable move
          // and we update the current line and the board state.
          setLine(move);
          chessboardState.addMove(move);
          playOpponentNextMoveIfLineContinues(move);
          // Return true to accept the move
          return true;
        }
      }

      // If we got here, the move is not correct
      setLastMoveResult("Incorrect");

      // We have to undo the move we did above
      gameObject.current.undo();
      return false;
    },
    [line, chessboardState]
  );

  const onShowComments = useCallback(() => {
    setShowComments(true);
  }, []);

  const onShowSolution = useCallback(() => {
    const bestMove = line?.children[0];

    if (bestMove == null) {
      throw new Error("bestMove is null");
    }

    setTimeout(async () => {
      applyMove(bestMove);
      playOpponentNextMoveIfLineContinues(bestMove);
    }, OPPONENT_MOVE_DELAY);

    setShowSolution(true);
  }, [line]);

  return (
    <>
      <Head>
        <title>Review Chess Game</title>
        <meta
          name="description"
          content="Enter a chess.com game ID to review"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="charcoal-bg text-white min-h-screen flex flex-col items-center justify-center">
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
            <div
              className="flex-none ml-6 bg-gray-800 p-4 overflow-hidden whitespace-normal"
              style={{ height: chessboardState.boardSize }}
            >
              <DescriptionArea
                result={lastMoveResult}
                comments={line?.comments || []}
                showComments={showComments}
              />
            </div>
          </div>
          <Controls
            onNewLine={onNewLine}
            onShowComments={onShowComments}
            onShowSolution={onShowSolution}
          />
        </div>
      </main>
    </>
  );
};

export default Home;
