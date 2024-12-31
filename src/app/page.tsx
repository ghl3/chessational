"use client";

import { Position } from "@/chess/Position";
import Chessboard, { MoveExecutor } from "@/components/Chessboard";
import { NavBar, Tab } from "@/components/NavBar";
import { default as OpeningGraph } from "@/components/OpeningTree";
import {
  executeLegalMoveIfIsCorrect,
  ReviewOrExploreLine,
} from "@/components/Review";
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
  tab: Tab;
  setTab: Dispatch<SetStateAction<Tab>>;
  chessboardState: ChessboardState;
  studyData: StudyData;
  engineData: EngineData;
  reviewState: ReviewState;
  height?: number;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  tab,
  setTab,
  chessboardState,
  studyData,
  engineData,
  reviewState,
  height,
}) => {
  return (
    <div className="flex flex-col flex-1 justify-start">
      <NavBar mode={tab} setMode={setTab} />
      {tab !== "STUDIES" && <StudyChapterSelector studyData={studyData} />}
      {tab === "STUDIES" && <Studies studyData={studyData} />}
      {tab === "REVIEW" && (
        <ReviewOrExploreLine
          chessboardState={chessboardState}
          studyData={studyData}
          engineData={engineData}
          reviewState={reviewState}
        />
      )}
      {tab === "SEARCH" && (
        <Search
          lines={studyData.lines || []}
          chapters={studyData.chapters || []}
          chessboardState={chessboardState}
        />
      )}
      {tab === "STATS" && (
        <StatsPage
          lines={studyData.lines || []}
          chapters={studyData.chapters || []}
          attempts={studyData.attempts || []}
          chessboardState={chessboardState}
        />
      )}
      {tab === "TREE" && (
        <OpeningGraph chapter={(studyData.chapters || [])[0]} />
      )}
    </div>
  );
};

interface HomeProps {
  params: { slug: string };
}

const getDefaultTab = (studyData: StudyData): Tab => {
  if (studyData.studies == null || studyData.studies.length === 0) {
    return "STUDIES";
  }

  return "REVIEW";
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

  const [tab, setTab] = useState<Tab>(getDefaultTab(studyData));

  // Set and maintain the size of the board
  const chessboardRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    if (chessboardRef.current) {
      setHeight(chessboardRef.current.clientHeight);
    }
  }, [chessboardSize]);

  const onLegalMove: MoveExecutor = useCallback(
    (
      newPosition: Position,
      sourceSquare: Square,
      targetSquare: Square,
      promoteToPiece?: PieceSymbol,
    ): boolean => {
      if (tab === "REVIEW" && reviewState.reviewMode === "QUIZ") {
        const moveResult = executeLegalMoveIfIsCorrect(
          chessboardState,
          reviewState,
          newPosition,
          sourceSquare,
          targetSquare,
          promoteToPiece,
        );
        if (moveResult === null) {
          return false;
        } else if (moveResult === "EXPLORE") {
          reviewState.setReviewMode("EXPLORE");
          return true;
        } else {
          return true;
        }
      } else {
        chessboardState.setNextPosition(newPosition, true);
        return true;
      }
    },
    [chessboardState, tab, reviewState],
  );

  return (
    <div className="flex flex-row w-full min-h-full">
      <div className="w-1/2 flex-shrink-0">
        <div ref={chessboardRef} className="flex-1 flex justify-end mr-3">
          <Chessboard
            chessboardSize={chessboardSize}
            chessboardState={chessboardState}
            onLegalMove={onLegalMove}
            className="flex-none"
          />
        </div>
      </div>

      <div className="w-1/2 min-w-fit flex-shrink-0">
        <div className="ml-3 min-h-full min-w-0">
          <RightPanel
            tab={tab}
            setTab={setTab}
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
