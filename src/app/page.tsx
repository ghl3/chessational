"use client";

import { Position } from "@/chess/Position";
import Chessboard, { MoveValidator } from "@/components/Chessboard";
import { InteractiveArea, Mode } from "@/components/InteractiveArea";
import { onValidPieceDrop as onReviewValidPieceDrop } from "@/components/ReviewLine";
import { useChessboardSize } from "@/hooks/UseChessboardSize";
import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import { useCurrentLineData } from "@/hooks/UseCurrentLineData";
import useEngine from "@/hooks/UseEvaluationCache";
import { useReviewState } from "@/hooks/UseReviewState";
import { useStudyData } from "@/hooks/UseStudyData";
import { PieceSymbol } from "chess.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { Square } from "react-chessboard/dist/chessboard/types";

// Only run the engine on the client.
//let engine: Engine | null = null;
//if (typeof window !== "undefined") {
//  engine = new Engine(new Worker("/stockfish/stockfish.asm.js"), 20, 3, false);
///}

const Home: React.FC = () => {
  // What state do we need at the top?
  // The current line (and setter)
  // The current line index (and setter)
  // The onPieceDrop logic

  // The currently selected line
  //const [lineAndChapter, setLineAndChapter] = useState<LineAndChapter | null>(
  //  null,
  //);
  // The current position in the line.
  // The next move to play is line.moves[lineIndex+1]
  //const [lineIndex, setLineIndex] = useState<number>(-1);

  const chessboardSize = useChessboardSize();
  const chessboardState: ChessboardState = useChessboardState();

  const [mode, setMode] = useState<Mode>("REVIEW");

  const studyData = useStudyData();
  const currentLineData = useCurrentLineData();
  const reviewState = useReviewState();

  // TODO: Refactor to 'useEngineData' hook
  const engineData = useEngine();
  /*
  useEffect(() => {
    if (engine) {
      engine.listener = (evaluation: EvaluatedPosition) => {
        addEvaluation(evaluation);
      };
    }
  }, [addEvaluation]);

  const [runEngine, setRunEngine] = useState<boolean>(false);
  */

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

      <InteractiveArea
        mode={mode}
        setMode={setMode}
        chessboardState={chessboardState}
        studyData={studyData}
        currentLineData={currentLineData}
        reviewState={reviewState}
        height={height || 0}
      />
    </main>
  );
};

export default Home;
