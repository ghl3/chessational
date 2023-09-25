"use client";

import Chessboard from "@/components/Chessboard";
import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import Head from "next/head";

const Home = () => {
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
        <Chessboard chessboardState={chessboardState} />
      </main>
    </>
  );
};

export default Home;
