"use client";

import Chessboard from "@/components/Chessboard";
import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import Head from "next/head";
import { useRef, useState } from "react";
import { StudySelector } from "@/components/StudySelector";
import { ChapterSelector, Chapter } from "@/components/ChapterSelector";
import { Controls } from "@/components/Controls";
import { MoveNode, PgnTree } from "@/chess/PgnTree";
import { Square } from "react-chessboard/dist/chessboard/types";
import { Chess } from "chess.js";

type Study = PgnTree[];

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
      name: pgnTree.headers["Event"] || "Unknown Chapter",
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

  // The list of moves from the current line.
  //const [moves, setMoves] = useState<Move[]>([]);

  const chessboardState: ChessboardState = useChessboardState();

  let gameObject = useRef<Chess>(new Chess());

  // Set the latest move in the line
  const [line, setLine] = useState<MoveNode | null>(null);
  // The next move in the line
  //const [nextMove, setNextMove] = useState<Move | null>(null);

  const fetchStudyData = async () => {
    if (!selectedStudy) return; // Exit if no study selected

    try {
      const newStudy = await getStudy(selectedStudy);
      setStudy(newStudy);
      setChapters(getChapters(newStudy));
    } catch (error) {
      console.error("Failed to get study:", error);
    }
  };

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
    const moveResult = gameObject.current.move(nextMoveNode.move);
    if (moveResult == null) {
      throw new Error("Move is null");
    }
    setLine(nextMoveNode);
    chessboardState.addMove(nextMoveNode);
  };

  const onNewLine = () => {
    // Reset the game
    gameObject.current = new Chess();
    setLine(null);

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
      /*
      const lineIndex = Math.floor(Math.random() * chapter.moveTree.length);
      const newLine = chapter.moveTree[lineIndex];
      setLine(newLine);

      // Update the line in our game state and on the board
      const moveResult = gameObject.current.move(newLine.move);
      if (moveResult == null) {
        throw new Error("Move is null");
      }
      chessboardState.addMove(newLine);
      */
    }
  };

  const onDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    if (line == null) {
      throw new Error("Line is null");
    }

    // Check that it's a valid move
    const moveResult = gameObject.current.move({
      from: sourceSquare,
      to: targetSquare,
    });

    if (moveResult == null) {
      return false;
    }

    // If so, check whether it's the correct move (or one of the correct moves)
    // If so, get the next move and add it to the line

    for (const move of line.children) {
      if (move.from === sourceSquare && move.to === targetSquare) {
        // Add it to the line
        setLine(move);
        // Add it to the game state
        chessboardState.addMove(move);

        // If this is the end of the line, we're done.
        if (move.children.length == 0) {
          // We've reached the end of the line
          console.log("End of the line");
          return true;
        } else {
          // Otherwise, pick the opponent's next move in the line
          // Do this in a delay to simulate a game.
          setTimeout(async () => {
            pickAndApplyMove(move.children);
            /*
            const nextMoveIndex = Math.floor(
              Math.random() * move.children.length
            );
            const nextMove = move.children[nextMoveIndex];
            setLine(nextMove);
            gameObject.current.move(nextMove.move);
            chessboardState.addMove(nextMove);
            */
          }, 500);
          return true;
        }
      }
    }

    // If we got here, the move is not correct
    console.log("Move is incorrect");

    // We have to undo the move we did above
    gameObject.current.undo();
    return false;
  };

  const onShowSolution = () => {};

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
      <main>
        <StudySelector
          selectedStudy={selectedStudy}
          onStudyChange={setSelectedStudy}
          onStudySubmit={fetchStudyData}
        />
        <ChapterSelector
          chapters={chapters}
          selectedChapter={selectedChapter}
          onChapterChange={setSelectedChapter}
        />
        <Chessboard chessboardState={chessboardState} onDrop={onDrop} />

        <Controls onNewLine={onNewLine} onShowSolution={onShowSolution} />
      </main>
    </>
  );
};

export default Home;
