"use client";

import Chessboard from "@/components/Chessboard";
import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import { Client } from "equine";
import Head from "next/head";

const getStudy = async (studyId: string) => {
  fetch("http://localhost:3000/api/getStudy", {
    method: "POST",

    cache: "force-cache",
    body: { studyId: studyId },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log(data);
    });
};

const Home: React.FC = () => {
  const chessboardState: ChessboardState = useChessboardState();

  //const client = new Client('foobar');
  //client.user.

  getStudy("gCdIXthy");

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
        <Chessboard chessboardState={chessboardState} />
      </main>
    </>
  );
};

export default Home;
