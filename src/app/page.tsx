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
  setMode,
  chessboardState,
  studyData,
  currentLineData,
  engineData,
  reviewState,
  height,
}) => {
  return (
    <div className="flex flex-col flex-1 justify-start ml-3">
      <NavBar mode={mode} setMode={setMode} studyData={studyData} />
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

const Home: React.FC = () => {
  const chessboardSize = useChessboardSize();
  const chessboardState: ChessboardState = useChessboardState();

  const [mode, setMode] = useState<Mode>("REVIEW");

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

  return (
    <main className="flex flex-row justify-center items-start mb-6 w-screen">
      <div ref={chessboardRef} className="flex-1 flex justify-end mr-3">
        <Chessboard
          chessboardSize={chessboardSize}
          chessboardState={chessboardState}
          onValidPieceDrop={onValidPieceDrop}
          className="flex-none"
        />
      </div>

      <RightPanel
        mode={mode}
        setMode={setMode}
        chessboardState={chessboardState}
        studyData={studyData}
        currentLineData={currentLineData}
        engineData={engineData}
        reviewState={reviewState}
        height={height || 0}
      />
    </main>
  );
};

export default Home;
