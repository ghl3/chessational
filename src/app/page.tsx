"use client";

import { Position } from "@/chess/Position";
import Chessboard, { MoveExecutor } from "@/components/Chessboard";
import Lines from "@/components/Lines";
import { NavBar, Tab } from "@/components/NavBar";
import { default as OpeningGraph } from "@/components/OpeningTree";
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

export interface RightPanelProps {
  tab: Tab;
  setTab: Dispatch<SetStateAction<Tab>>;
  chessboardState: ChessboardState;
  studyData: StudyData;
  engineData: EngineData;
  reviewState: ReviewState;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  tab,
  setTab,
  chessboardState,
  studyData,
  engineData,
  reviewState,
}) => {
  return (
    <div className="flex flex-col flex-1 justify-start">
      <NavBar mode={tab} setMode={setTab} />
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

      {/*
      {tab === "TREE" && (
        <OpeningGraph chapter={(studyData.chapters || [])[0]} />
      )}
      */}
    </div>
  );
};

interface HomeProps {
  params: { slug: string };
}

const getDefaultTab = (studyData: StudyData): Tab => {
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
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
