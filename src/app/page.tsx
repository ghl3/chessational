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
import { PgnTree } from "@/chess/PgnTree";

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

  console.log(res);

  const json = await res.json();

  const { pgns } = json;

  return pgns;
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

  const chessboardState: ChessboardState = useChessboardState();

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
        />
        <ChapterSelector
          chapters={chapters}
          selectedChapter={selectedChapter}
          onChapterChange={setSelectedChapter}
        />
        <Chessboard chessboardState={chessboardState} />
      </main>
    </>
  );
};

export default Home;
