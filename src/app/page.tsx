"use client";

import { Position } from "@/chess/Position";
import { PositionNode } from "@/chess/PositionTree";
import Chessboard, { MoveValidator } from "@/components/Chessboard";
import { Mode, NavBar } from "@/components/NavBar";
import { default as OpeningGraph } from "@/components/OpeningTree";
import { onValidPieceDrop as onReviewValidPieceDrop } from "@/components/ReviewLine";
import { ReviewOrExploreLine } from "@/components/ReviewOrExplore";
import Search from "@/components/Search";
import StatsPage from "@/components/Stats";
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

export interface RightPanelProps {
  mode: Mode;
  setMode: Dispatch<SetStateAction<Mode>>;
  chessboardState: ChessboardState;
  studyData: StudyData;
  engineData: EngineData;
  reviewState: ReviewState;
  height?: number;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  mode,
  setMode,
  chessboardState,
  studyData,
  engineData,
  reviewState,
  height,
}) => {
  return (
    <div className="flex flex-col flex-1 justify-start">
      <NavBar mode={mode} setMode={setMode} />
      {mode !== "STUDIES" && <StudyChapterSelector studyData={studyData} />}
      {mode === "STUDIES" && <Studies studyData={studyData} />}
      {(mode === "REVIEW" || mode == "EXPLORE") && (
        <ReviewOrExploreLine
          mode={mode}
          chessboardState={chessboardState}
          studyData={studyData}
          engineData={engineData}
          reviewState={reviewState}
        />
      )}
      {mode === "SEARCH" && (
        <Search
          lines={studyData.lines || []}
          chapters={studyData.chapters || []}
          chessboardState={chessboardState}
        />
      )}
      {mode === "STATS" && (
        <div className="min-w-0">
          {" "}
          {/* Added wrapper with min-w-0 */}
          <StatsPage
            lines={studyData.lines || []}
            chapters={studyData.chapters || []}
            attempts={studyData.attempts || []}
            chessboardState={chessboardState}
          />
        </div>
      )}
      {mode === "TREE" && (
        <OpeningGraph
          chapter={(studyData.chapters || [])[0]}
          onNodeClick={(node: PositionNode): void => {
            console.log("Clicked move:", node.position.lastMove?.san);
          }}
        />
      )}
    </div>
  );
};

interface HomeProps {
  params: { slug: string };
}

const getDefaultMode = (studyData: StudyData): Mode => {
  if (
    studyData.selectedChapterNames &&
    studyData.selectedChapterNames.length > 0
  ) {
    return "REVIEW";
  }

  return "EXPLORE";
};

const Home: React.FC<HomeProps> = ({ params }) => {
  const chessboardSize = useChessboardSize();
  const chessboardState: ChessboardState = useChessboardState();

  const studyData = useStudyData();
  const reviewState = useReviewState();

  const engineData = useEngine();
  useEffect(() => {
    if (engine) {
      engineData.setEngine(engine);
    }
  }, [engineData]);

  const [mode, setMode] = useState<Mode>(getDefaultMode(studyData));

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
        reviewState,
        newPosition,
        sourceSquare,
        targetSquare,
        promoteToPiece,
      );
    },
    [chessboardState, reviewState],
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
    <div className="flex flex-row w-full min-h-full">
      {/* Left Column: Fixed at 50% of viewport */}
      <div className="w-1/2 flex-shrink-0">
        <div ref={chessboardRef} className="flex-1 flex justify-end mr-3">
          <Chessboard
            chessboardSize={chessboardSize}
            chessboardState={chessboardState}
            onValidPieceDrop={onValidPieceDrop}
            className="flex-none"
          />
        </div>
      </div>

      {/* Right Column: 50% minimum but can expand */}
      <div className="w-1/2 min-w-fit flex-shrink-0">
        <div className="ml-3 min-h-full min-w-0">
          <RightPanel
            mode={mode}
            setMode={setMode}
            chessboardState={chessboardState}
            studyData={studyData}
            engineData={engineData}
            reviewState={reviewState}
            height={height || 0}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
