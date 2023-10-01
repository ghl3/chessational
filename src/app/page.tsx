"use client";

import Chessboard from "@/components/Chessboard";
import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import Head from "next/head";
import { useCallback, useRef, useState } from "react";
import { StudySelector } from "@/components/StudySelector";
import { ChapterSelector, Chapter } from "@/components/ChapterSelector";
import { Controls } from "@/components/Controls";
import { Move, MoveNode, PgnTree } from "@/chess/PgnTree";
import { Square } from "react-chessboard/dist/chessboard/types";
import { Chess, Move as MoveResult } from "chess.js";
import DescriptionArea from "@/components/DescriptionArea";
import { LineResult } from "@/components/MoveDescription";

type Study = PgnTree[];

const OPPONENT_MOVE_DELAY = 250;

const getStudy = async (studyId: string): Promise<Study> => {
  const res = await fetch("http://localhost:3000/api/getStudy", {
    method: "POST",
    cache: "force-cache",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ studyId: studyId }),
  });

  if (res.status !== 200) {
    console.log("Error");
    throw new Error("Error");
  }

  const { pgns } = await res.json();

  return pgns;
};

const getChapters = (pgnTrees: Study): Chapter[] => {
  const chapters: Chapter[] = [];

  for (let i = 0; i < pgnTrees.length; i++) {
    const pgnTree = pgnTrees[i];
    const chapter: Chapter = {
      index: i,
      name: pgnTree.chapter || "Unknown Chapter",
    };

    chapters.push(chapter);
  }

  return chapters;
};

const Home: React.FC = () => {
  const [selectedStudy, setSelectedStudy] = useState<string | undefined>(
    undefined
  );
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string | undefined>(
    undefined
  );
  const [study, setStudy] = useState<Study | undefined>(undefined);

  const [lastMoveResult, setLastMoveResult] = useState<LineResult>("Unknown");

  const chessboardState: ChessboardState = useChessboardState();

  const [showComments, setShowComments] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  // Set the latest move in the line
  const [line, setLine] = useState<MoveNode | null>(null);

  let gameObject = useRef<Chess>(new Chess());

  const fetchStudyData = useCallback(async () => {
    // Exit if no study selected
    if (!selectedStudy) {
      return;
    }

    try {
      const newStudy = await getStudy(selectedStudy);
      setStudy(newStudy);
      setChapters(getChapters(newStudy));
    } catch (error) {
      console.error("Failed to get study:", error);
    }
  }, [selectedStudy]);

  // Find the chapter with the given name, or choose a random chapter
  // if the name is null.
  const findOrChooseChapter = (
    study: Study,
    selectedChapter: string | null
  ): PgnTree => {
    if (selectedChapter == null) {
      // Randomly pick a chapter
      const chapterIndex = Math.floor(Math.random() * study.length);
      return study[chapterIndex];
    } else {
      // Find the chapter
      const chapter = study.find(
        (chapter) => chapter.headers["Event"] == selectedChapter
      );
      if (chapter == null) {
        throw new Error("chapter is null");
      }
      return chapter;
    }
  };

  const pickAndApplyMove = (moveNodes: MoveNode[]) => {
    const moveIndex = Math.floor(Math.random() * moveNodes.length);
    const nextMoveNode = moveNodes[moveIndex];

    const moveResult = moveOrNull(nextMoveNode.from, nextMoveNode.to);
    //const moveResult = gameObject.current.move(nextMoveNode.move);
    if (moveResult == null) {
      throw new Error("Move is null");
    }
    setLine(nextMoveNode);
    chessboardState.addMove(nextMoveNode);
  };

  const onNewLine = useCallback(() => {
    // Reset the game
    gameObject.current = new Chess();
    setLine(null);
    setLastMoveResult("Unknown");

    if (study == null) {
      throw new Error("study is null");
    }

    const chapter = findOrChooseChapter(study, selectedChapter || null);

    chessboardState.setOrientation(
      chapter.orientation == "w" ? "white" : "black"
    );

    // If we are black, we first have to do white's move
    if (chapter.orientation == "b") {
      pickAndApplyMove(chapter.moveTree);
    }
  }, [study, selectedChapter, chessboardState]);

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

          // If this is the end of the line, we're done.
          if (move.children.length == 0) {
            setLastMoveResult("Line Complete");
          } else {
            setLastMoveResult("Correct");
            // Otherwise, pick the opponent's next move in the line
            // Do this in a delay to simulate a game.
            setTimeout(async () => {
              pickAndApplyMove(move.children);
            }, OPPONENT_MOVE_DELAY);
          }
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

  const onShowSolution = useCallback(() => {
    setShowSolution(true);
  }, []);

  const onShowComments = useCallback(() => {
    setShowComments(true);
  }, []);

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
          <StudySelector
            selectedStudy={selectedStudy}
            onStudyChange={setSelectedStudy}
            onStudySubmit={fetchStudyData}
            className="mb-6"
          />
          <ChapterSelector
            chapters={chapters}
            selectedChapter={selectedChapter}
            onChapterChange={setSelectedChapter}
            className="mb-6"
          />
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
            onShowSolution={onShowSolution}
            onShowComments={onShowComments}
          />
        </div>
      </main>
    </>
  );
};

export default Home;
