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
  const { boardSize } = useChessboardSize();
  const chessboardState: ChessboardState = useChessboardState();

  const studyData = useStudyData();
  const reviewState = useReviewState();

  const engineData = useEngine();
  
  // Initialize engine once on mount
  useEffect(() => {
    if (engine && !engineData.engine) {
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
      if (tab === "REVIEW" && reviewState.lineStatus !== "LINE_COMPLETE") {
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

  const calculatedPanelHeight = boardSize + 158;

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-900">
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 justify-center">
        {/* Chessboard Section - Left/Top */}
        <div className="flex-shrink-0 flex items-start justify-center lg:h-full overflow-y-auto lg:overflow-visible">
          <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
            <Chessboard
              chessboardSize={boardSize}
              chessboardState={chessboardState}
              onLegalMove={onLegalMove}
            />
          </div>
        </div>

        {/* Right Panel Section - Right/Bottom */}
        <div
          className="w-full lg:w-[700px] flex-shrink-0 flex flex-col min-h-0 !h-auto lg:!h-[var(--panel-height)]"
          style={
            {
              "--panel-height": `${calculatedPanelHeight}px`,
            } as React.CSSProperties
          }
        >
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
