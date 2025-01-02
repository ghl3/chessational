"use client";

import { Position } from "@/chess/Position";
import { Attempts } from "@/components/Attempts";
import Chessboard, { MoveExecutor } from "@/components/Chessboard";
import Lines from "@/components/Lines";
import { NavBar, Tab } from "@/components/NavBar";
import {
  executeLegalMoveIfIsCorrect,
  ReviewOrExploreLine,
} from "@/components/Review";
import { Studies } from "@/components/Studies";
import { StudyChapterSelector } from "@/components/StudyChapterSelector";
import { Engine } from "@/engine/Engine";
import { useChessboardSize } from "@/hooks/UseChessboardSize";
import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import useEngine, { EngineData } from "@/hooks/UseEngineData";
import { ReviewState, useReviewState } from "@/hooks/UseReviewState";
import { StudyData, useStudyData } from "@/hooks/UseStudyData";
import { PieceSymbol } from "chess.js";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Square } from "react-chessboard/dist/chessboard/types";

// Only run the engine on the client.
let engine: Engine | null = null;
if (typeof window !== "undefined") {
  engine = new Engine(new Worker("/stockfish/stockfish.asm.js"), 20, 3, false);
}

interface RightPanelProps {
  tab: Tab;
  setTab: Dispatch<SetStateAction<Tab>>;
  chessboardState: ChessboardState;
  studyData: StudyData;
  engineData: EngineData;
  reviewState: ReviewState;
}

const RightPanel: React.FC<RightPanelProps> = ({
  tab,
  setTab,
  chessboardState,
  studyData,
  engineData,
  reviewState,
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-gray-800 rounded-lg">
      <NavBar mode={tab} setMode={setTab} />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {tab !== "STUDIES" && <StudyChapterSelector studyData={studyData} />}
          {tab === "STUDIES" && <Studies studyData={studyData} />}
          {tab === "LINES" && (
            <Lines
              lines={studyData.lines || []}
              chapters={studyData.chapters || []}
              attempts={studyData.attempts || []}
              chessboardState={chessboardState}
            />
          )}
          {tab === "REVIEW" && (
            <ReviewOrExploreLine
              chessboardState={chessboardState}
              studyData={studyData}
              engineData={engineData}
              reviewState={reviewState}
            />
          )}
          {tab === "ATTEMPTS" && (
            <Attempts
              lines={studyData.lines || []}
              chapters={studyData.chapters || []}
              attempts={studyData.attempts || []}
              chessboardState={chessboardState}
            />
          )}
        </div>
      </div>
    </div>
  );
};

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

  // Set and maintain the size of the board
  //const chessboardRef = useRef<HTMLDivElement>(null);

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
      <div className="w-full flex-1 flex flex-col lg:flex-row gap-2">
        {/* Left column - minimal side padding, aligned top */}
        <div ref={containerRef} className="w-full lg:w-1/2 flex justify-center">
          <div className="flex flex-col">
            <Chessboard
              chessboardSize={boardSize}
              chessboardState={chessboardState}
              onLegalMove={onLegalMove}
            />
          </div>
        </div>

        {/* Right column - same top padding */}
        <div className="w-full lg:w-1/2 pt-8 px-4">
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
