"use client";

import { createContext, useContext, ReactNode, useEffect, useCallback, useRef } from "react";
import { ChessboardState, useChessboardState } from "@/hooks/UseChessboardState";
import { EngineData } from "@/hooks/UseEngineData";
import useEngine from "@/hooks/UseEngineData";
import { ReviewState, useReviewState } from "@/hooks/UseReviewState";
import { StudyData, useStudyData } from "@/hooks/UseStudyData";
import { Engine } from "@/engine/Engine";
import { Position } from "@/chess/Position";
import { executeLegalMoveIfIsCorrect } from "@/components/Review";
import { MoveExecutor } from "@/components/Chessboard";
import { PieceSymbol, Square } from "chess.js";

// Create engine lazily on first access (singleton pattern)
let engineInstance: Engine | null = null;
const getEngine = (): Engine | null => {
  if (typeof window === "undefined") return null;
  if (!engineInstance) {
    engineInstance = new Engine(new Worker("/stockfish/stockfish.asm.js"), 20, 3, false);
  }
  return engineInstance;
};

export interface AppContextType {
  studyData: StudyData;
  chessboardState: ChessboardState;
  engineData: EngineData;
  reviewState: ReviewState;
  onLegalMove: MoveExecutor;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return ctx;
};

interface AppProviderProps {
  children: ReactNode;
  currentTab: string;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, currentTab }) => {
  const chessboardState: ChessboardState = useChessboardState();
  const studyData = useStudyData();
  const reviewState = useReviewState();
  const engineData = useEngine();
  const engineInitializedRef = useRef(false);

  // Clear arrows when tab changes
  const { setArrows } = chessboardState;
  useEffect(() => {
    setArrows([]);
  }, [currentTab, setArrows]);

  // Initialize engine once on mount
  // Using a ref ensures we only initialize once even in StrictMode
  useEffect(() => {
    if (engineInitializedRef.current) return;
    
    const engine = getEngine();
    if (engine && !engineData.engine) {
      engineData.setEngine(engine);
      engineInitializedRef.current = true;
    }
  }, [engineData]);

  const onLegalMove: MoveExecutor = useCallback(
    (
      newPosition: Position,
      sourceSquare: Square,
      targetSquare: Square,
      promoteToPiece?: PieceSymbol,
    ): boolean => {
      // The user is in 'Quiz' mode until the end of the line, where
      // they enter 'Explore' mode. Quiz mode is active on the Practice page.
      if (currentTab === "/practice" && reviewState.lineStatus !== "LINE_COMPLETE") {
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
    [chessboardState, currentTab, reviewState],
  );

  return (
    <AppContext.Provider
      value={{
        studyData,
        chessboardState,
        engineData,
        reviewState,
        onLegalMove,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
