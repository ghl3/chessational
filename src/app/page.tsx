"use client";

import Chessboard from "@/components/Chessboard";
import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import Head from "next/head";
import { useState } from "react";
import { StudySelector } from "@/components/StudySelector";
import { ChapterSelector, Chapter } from "@/components/ChapterSelector";
import { Controls } from "@/components/Controls";
import { Move, PgnTree } from "@/chess/PgnTree";

type PgnTrees = PgnTree[];

const getStudy = async (studyId: string): Promise<PgnTrees> => {
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

const getChapters = (pgnTrees: PgnTrees): Chapter[] => {
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

  const [pgnTree, setPgnTree] = useState<PgnTrees | undefined>(undefined);

  // The list of moves from the current line.
  const [moves, setMoves] = useState<Move[]>([]);

  const chessboardState: ChessboardState = useChessboardState();

  const fetchStudyData = async () => {
    if (!selectedStudy) return; // Exit if no study selected

    try {
      const newPgnTrees = await getStudy(selectedStudy);
      setPgnTree(newPgnTrees);
      setChapters(getChapters(newPgnTrees));
    } catch (error) {
      console.error("Failed to get study:", error);
    }
  };

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
        <Chessboard chessboardState={chessboardState} />

        <Controls onNewLine={() => {}} onShowSolution={() => {}} />
      </main>
    </>
  );
};

export default Home;
