"use client";

import { Position } from "@/chess/Position";
import Chessboard, { MoveValidator } from "@/components/Chessboard";
import { Mode, NavBar } from "@/components/NavBar";
import { onValidPieceDrop as onReviewValidPieceDrop } from "@/components/ReviewLine";
import { ReviewOrExploreLine } from "@/components/ReviewOrExplore";
import StatsPage from "@/components/Stats";
import { Engine } from "@/engine/Engine";
import { useChessboardSize } from "@/hooks/UseChessboardSize";
import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import {
  CurrentLineData,
  useCurrentLineData,
} from "@/hooks/UseCurrentLineData";
import useEngine, { EngineData } from "@/hooks/UseEngineData";
import { ReviewState, useReviewState } from "@/hooks/UseReviewState";
import { StudyData, useStudyData } from "@/hooks/UseStudyData";
import { PieceSymbol } from "chess.js";
import { notFound } from "next/navigation";
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

export interface RightPanelProps {
  mode: Mode;
  setMode: Dispatch<SetStateAction<Mode>>;
  chessboardState: ChessboardState;
  studyData: StudyData;
  currentLineData: CurrentLineData;
  engineData: EngineData;
  reviewState: ReviewState;
  height?: number;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  mode,
  //setMode,
  chessboardState,
  studyData,
  currentLineData,
  engineData,
  reviewState,
  height,
}) => {
  return (
    <div className="flex flex-col flex-1 justify-start">
      <NavBar mode={mode} studyData={studyData} />
      {(mode === "REVIEW" || mode == "EXPLORE") && (
        <ReviewOrExploreLine
          mode={mode}
          chessboardState={chessboardState}
          studyData={studyData}
          currentLineData={currentLineData}
          engineData={engineData}
          reviewState={reviewState}
          height={height || 0}
        />
      )}
      {mode === "SEARCH" && <div>Search</div>}
      {mode === "STATS" && <StatsPage />}
    </div>
  );
};

interface HomeProps {
  params: { slug: string };
}

const parseModeFromSlug = (slug: string): Mode | null => {
  if (slug === "review") {
    return "REVIEW";
  } else if (slug === "explore") {
    return "EXPLORE";
  } else if (slug === "search") {
    return "SEARCH";
  } else if (slug === "stats") {
    return "STATS";
  }

  return null;
};

const Home: React.FC<HomeProps> = ({ params }) => {
  const chessboardSize = useChessboardSize();
  const chessboardState: ChessboardState = useChessboardState();

  //const [mode, setMode] = useState<Mode>("REVIEW");

  const mode = parseModeFromSlug(params.slug);
  if (mode === null) {
    notFound();
  }

  const studyData = useStudyData();
  const currentLineData = useCurrentLineData();
  const reviewState = useReviewState();

  const engineData = useEngine();
  useEffect(() => {
    if (engine) {
      engineData.setEngine(engine);
    }
  }, [engineData]);

  // Set and maintain the size of the board
  const chessboardRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    if (chessboardRef.current) {
      setHeight(chessboardRef.current.clientHeight);
    }
  }, [chessboardSize]);

  const moveMatchesCorrectMove = useCallback(
    (
      newPosition: Position,
      sourceSquare: Square,
      targetSquare: Square,
      promoteToPiece?: PieceSymbol,
    ): boolean => {
      return onReviewValidPieceDrop(
        chessboardState,
        currentLineData,
        reviewState,
        newPosition,
        sourceSquare,
        targetSquare,
        promoteToPiece,
      );
    },
    [chessboardState, currentLineData, reviewState],
  );

  const onValidPieceDrop: MoveValidator = (
    newPosition: Position,
    sourceSquare: Square,
    targetSquare: Square,
    promoteToPiece?: PieceSymbol,
  ): boolean => {
    if (mode === "REVIEW") {
      return moveMatchesCorrectMove(
        newPosition,
        sourceSquare,
        targetSquare,
        promoteToPiece,
      );
    }

    return true;
  };

  console.log("Parmas: ");
  console.log(params.slug);

  return (
    <main className="flex flex-row justify-center w-screen">
      <div className="w-1/2">
        <div ref={chessboardRef} className="flex-1 flex justify-end mr-3">
          <Chessboard
            chessboardSize={chessboardSize}
            chessboardState={chessboardState}
            onValidPieceDrop={onValidPieceDrop}
            className="flex-none"
          />
        </div>
      </div>

      <div className="w-1/2">
        <div className="ml-3">
          <RightPanel
            mode={mode}
            //setMode={setMode}
            chessboardState={chessboardState}
            studyData={studyData}
            currentLineData={currentLineData}
            engineData={engineData}
            reviewState={reviewState}
            height={height || 0}
          />
        </div>
      </div>
    </main>
  );
};

export default Home;
