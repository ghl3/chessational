"use client";

import Chessboard from "@/components/Chessboard";
import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import Head from "next/head";

const getStudy = async (studyId: string) => {
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
    return;
  }

  console.log(res);

  const json = await res.json();

  console.log(json);
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
