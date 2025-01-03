"use client";

import { Position } from "@/chess/Position";
import Chessboard, { MoveExecutor } from "@/components/Chessboard";
import { Tab } from "@/components/NavBar";
import { executeLegalMoveIfIsCorrect, Review } from "@/components/Review";
import { RightPanel } from "@/components/RightPanel";
import { Engine } from "@/engine/Engine";
import { useChessboardSize } from "@/hooks/UseChessboardSize";
import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import useEngine from "@/hooks/UseEngineData";
import { useReviewState } from "@/hooks/UseReviewState";
import { StudyData, useStudyData } from "@/hooks/UseStudyData";
import { PieceSymbol } from "chess.js";
import { useCallback, useEffect, useState } from "react";
import { Square } from "react-chessboard/dist/chessboard/types";

// Only run the engine on the client.
let engine: Engine | null = null;
if (typeof window !== "undefined") {
  engine = new Engine(new Worker("/stockfish/stockfish.asm.js"), 20, 3, false);
}

interface HomeProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const getDefaultTab = (studyData: StudyData): Tab => {
  return "REVIEW";
};

const Home: React.FC<HomeProps> = ({ params }) => {
  const { boardSize, containerRef } = useChessboardSize();
  const chessboardState: ChessboardState = useChessboardState();

  const studyData = useStudyData();
  const reviewState = useReviewState();

  const engineData = useEngine();
  useEffect(() => {
    if (engine) {
      engineData.setEngine(engine);
    }
  }, [engineData]);

  const [tab, setTab] = useState<Tab>(getDefaultTab(studyData));

  const onLegalMove: MoveExecutor = useCallback(
    (
      newPosition: Position,
      sourceSquare: Square,
      targetSquare: Square,
      promoteToPiece?: PieceSymbol,
    ): boolean => {
      // The user is in 'Quiz' mode until the end of the line, where
      // they enter 'Explore' mode.
      if (tab === "REVIEW" && reviewState.lineStatus != "LINE_COMPLETE") {
        return executeLegalMoveIfIsCorrect(
          chessboardState,
          reviewState,
          newPosition,
          sourceSquare,
          targetSquare,
          promoteToPiece,
        );
      } else {
        chessboardState.setNextPosition(newPosition, true);
        return true;
      }
    },
    [chessboardState, tab, reviewState],
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full flex-1 flex flex-col lg:flex-row">
        <div
          ref={containerRef}
          className="w-full lg:w-1/2 flex justify-center lg:justify-end px-2"
        >
          <div className="flex flex-col">
            <Chessboard
              chessboardSize={boardSize}
              chessboardState={chessboardState}
              onLegalMove={onLegalMove}
            />
          </div>
        </div>

        <div className="w-full lg:w-1/2 pt-8 px-2">
          <RightPanel
            tab={tab}
            setTab={setTab}
            chessboardState={chessboardState}
            studyData={studyData}
            engineData={engineData}
            reviewState={reviewState}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
