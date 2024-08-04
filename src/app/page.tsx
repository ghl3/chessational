"use client";

import { Position } from "@/chess/Position";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import Chessboard, { MoveValidator } from "@/components/Chessboard";
import { Explore } from "@/components/Explore";

import { StudyLine } from "@/components/StudyLine";
import { useChessboardSize } from "@/hooks/UseChessboardSize";
import {
  ChessboardState,
  useChessboardState,
} from "@/hooks/UseChessboardState";
import { PieceSymbol } from "chess.js";
import { useEffect, useRef, useState } from "react";
import { Square } from "react-chessboard/dist/chessboard/types";

const Home: React.FC = () => {
  // What state do we need at the top?
  // The current line (and setter)
  // The current line index (and setter)
  // The onPieceDrop logic

  const [lineAndChapter, setLineAndChapter] = useState<LineAndChapter | null>(
    null,
  );
  // The current position in the line.
  // The next move to play is line.moves[lineIndex+1]
  const [lineIndex, setLineIndex] = useState<number>(-1);

  const chessboardSize = useChessboardSize();
  const chessboardState: ChessboardState = useChessboardState();

  const [mode, setMode] = useState<"STUDY" | "EXPLORE" | "SEARCH">("STUDY");

  // Set and maintain the size of the board
  const chessboardRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    if (chessboardRef.current) {
      setHeight(chessboardRef.current.clientHeight);
    }
  }, [chessboardSize]);

  const onValidPieceDropRef = useRef<MoveValidator | null>(null);

  const onValidPieceDrop = (
    newPosition: Position,
    sourceSquare: Square,
    targetSquare: Square,
    promoteToPiece?: PieceSymbol,
  ): boolean => {
    if (onValidPieceDropRef.current == null) {
      throw new Error("onValidPieceDropRef.current is null");
    }
    return onValidPieceDropRef.current(
      newPosition,
      sourceSquare,
      targetSquare,
      promoteToPiece,
    );
  };

  return (
    <main className="flex flex-col items-center">
      <div className="flex flex-col items-center items-start mb-6 max-w-screen-xl space-y-2">
        <div className="flex flex-row justify-center items-start mb-6 w-screen">
          <div ref={chessboardRef} className="flex-1 flex justify-end mr-3">
            <Chessboard
              chessboardSize={chessboardSize}
              chessboardState={chessboardState}
              onValidPieceDrop={onValidPieceDrop}
              className="flex-none"
            />
          </div>

          <div className="flex-1 flex justify-start  ml-3">
            {mode === "STUDY" && (
              <StudyLine
                chessboardState={chessboardState}
                onValidPieceDropRef={onValidPieceDropRef}
                lineAndChapter={lineAndChapter}
                setLineAndChapter={setLineAndChapter}
                lineIndex={lineIndex}
                setLineIndex={setLineIndex}
                height={height || 0}
              />
            )}
            {mode === "EXPLORE" && (
              <Explore
                chessboardState={chessboardState}
                onValidPieceDropRef={onValidPieceDropRef}
                lineAndChapter={lineAndChapter}
                setLineAndChapter={setLineAndChapter}
                lineIndex={lineIndex}
                setLineIndex={setLineIndex}
                height={height || 0}
              />
            )}
            {mode === "SEARCH" && <div>Search</div>}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
