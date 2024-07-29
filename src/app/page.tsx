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

  // const [lineMoveResult, setLineMoveResult] =
  //   useStateWithTimeout<LineMoveResult | null>(null, 2000);

  //const [attemptResult, setAttemptResult] = useState<boolean | null>(null);

  // When not null, the solution to show to the user.
  //const [solution, setSolution] = useState<Move | null>(null);

  const chessboardSize = useChessboardSize();
  const chessboardState: ChessboardState = useChessboardState();

  const [mode, setMode] = useState<"STUDY" | "EXPLORE" | "SEARCH">("EXPLORE");

  // Set and maintain the size of the board
  const chessboardRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    if (chessboardRef.current) {
      setHeight(chessboardRef.current.clientHeight);
    }
  }, [chessboardSize]);

  const [onValidPieceDrop, setOnValidPieceDrop] =
    useState<MoveValidator | null>(null);

  /*
  const playOpponentNextMoveIfLineContinues = useCallback(
    (line: Line, lineIndex: number) => {
      const endOfLine = lineIndex == line.positions.length - 1;

      // If this is the end of the line, we're done.
      if (endOfLine) {
        // If we got to the end of the line without any attempt failures,
        // we mark the attempt as complete
        if (attemptResult == null) {
          setAttemptResult(true);
          storeAttemptResult(line, true, db.attempts);
        }
      } else {
        // Otherwise, pick the opponent's next move in the line
        // Do this in a delay to simulate a game.
        setTimeout(async () => {
          const nextPosition = line.positions[lineIndex + 1];
          chessboardState.setNextPosition(nextPosition, false);
          setLineIndex((lineIndex) => lineIndex + 1);
        }, OPPONENT_MOVE_DELAY);
      }
    },
    [attemptResult, chessboardState],
  );

  // Define two functions

  const onValidPieceDrop = useCallback(
    (
      newPosition: Position,
      sourceSquare: Square,
      targetSquare: Square,
      promoteToPiece?: PieceSymbol,
    ): boolean => {
      if (mode == "EXPLORE") {
        // In explore mode, we just make the move
        chessboardState.setNextPosition(newPosition, true);
        return true;
      }

      // Otherwise, we're in line mode.
      if (lineAndChapter == null) {
        window.alert('Please click "New Line" to start a new line.');
        return false;
      }

      // If the current board position is not the next position in the line,
      // we don't accept the move.  This can happen if the user uses
      // the left/right arrows to move around the line and then tries to move
      // when not in the latest position in the line.
      if (
        lineAndChapter.line.positions[lineIndex] !=
        chessboardState.getPosition()
      ) {
        setLineMoveResult(null);
        return false;
      }

      // Check whether the attempted move is the next move in the line.
      const nextMoveInLine: Move | null =
        lineAndChapter.line.positions[lineIndex + 1].lastMove;
      if (nextMoveInLine == null) {
        throw new Error("nextMoveInLine is null");
      }

      if (
        nextMoveInLine.from === sourceSquare &&
        nextMoveInLine.to === targetSquare &&
        (promoteToPiece || null) == (nextMoveInLine.promotion || null)
      ) {
        // If it matches a child node, it's an acceptable move
        // and we update the current line and the board state.
        // Note that we use line.positions[lineIndex + 1] because
        // we want to make sure to keep the comments.
        chessboardState.setNextPosition(
          lineAndChapter.line.positions[lineIndex + 1],
          false,
        );

        // Since the move was correct, we move to the next position in the line
        setLineIndex((lineIndex) => lineIndex + 1);
        setLineMoveResult("CORRECT");
        setSolution(null);

        // We play the opponent's next move if the line continues.
        playOpponentNextMoveIfLineContinues(lineAndChapter.line, lineIndex + 1);

        // Return true to accept the move
        return true;
      }

      // If we got here, the move is not correct
      setLineMoveResult("INCORRECT");
      if (attemptResult == null) {
        setAttemptResult(false);
        storeAttemptResult(lineAndChapter.line, false, db.attempts);
      }
      setSolution(null);
      return false;
    },
    [
      mode,
      lineAndChapter,
      lineIndex,
      chessboardState,
      setLineMoveResult,
      attemptResult,
      playOpponentNextMoveIfLineContinues,
    ],
  );
  */

  /*
  const solutionArrows: Arrow[] =
    solution != null
      ? [
          {
            from: solution.from,
            to: solution.to,
            color: "rgb(0, 100, 0)",
          },
        ]
      : [];
      */

  // TODO: Need to leverage a hook to expose onPieceDrop and the current line.

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
                setOnValidPieceDrop={setOnValidPieceDrop}
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
                setOnValidPieceDrop={setOnValidPieceDrop}
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
