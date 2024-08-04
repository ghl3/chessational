import { storeAttemptResult } from "@/chess/Attempt";
import { Move } from "@/chess/Move";
import { Position } from "@/chess/Position";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { CurrentLineData } from "@/hooks/UseCurrentLineData";
import { ReviewState } from "@/hooks/UseReviewState";
import { StudyData } from "@/hooks/UseStudyData";
import { pickLine } from "@/utils/LinePicker";
import { PieceSymbol, Square } from "chess.js";
import React, { useCallback, useMemo } from "react";
import { db } from "../app/db";
import { Controls } from "./Controls";
import { MoveDescription } from "./MoveDescription";

const OPPONENT_MOVE_DELAY = 250;

export const onValidPieceDrop = (
  chessboardState: ChessboardState,
  currentLineData: CurrentLineData,
  reviewState: ReviewState,
  newPosition: Position,
  sourceSquare: Square,
  targetSquare: Square,
  promoteToPiece?: PieceSymbol,
): boolean => {
  if (currentLineData.lineAndChapter == null) {
    window.alert('Please click "New Line" to start a new line.');
    return false;
  }

  const line = currentLineData.lineAndChapter.line;
  const lineIndex = currentLineData.lineIndex;

  // If the current board position is not the next position in the line,
  // we don't accept the move.  This can happen if the user uses
  // the left/right arrows to move around the line and then tries to move
  // when not in the latest position in the line.
  if (line.positions[lineIndex] != chessboardState.getPosition()) {
    reviewState.setLineMoveResult(null);
    return false;
  }

  // Check whether the attempted move is the next move in the line.
  const nextMoveInLine: Move | null = line.positions[lineIndex + 1].lastMove;
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
    chessboardState.setNextPosition(line.positions[lineIndex + 1], false);

    // As a sanity check, make sure the next position in the line matches
    // the expected next position from the move
    if (newPosition.fen != line.positions[lineIndex + 1].fen) {
      throw new Error("newPosition does not match the expected next position");
    }

    // Since the move was correct, we move to the next position in the line
    currentLineData.setLineIndex(lineIndex + 1);
    reviewState.setLineMoveResult("CORRECT");
    reviewState.setShowSolution(false);
    chessboardState.setArrows([]);

    const nextLineIndex = lineIndex + 1;

    // If this is the end of the line, we're done.
    // Otherwise, we play the opponent's next move and advance
    // to that position.
    const endOfLine = nextLineIndex == line.positions.length - 1;

    // If this is the end of the line, we're done.
    if (endOfLine) {
      // If we got to the end of the line without any attempt failures,
      // we mark the attempt as complete.
      // We check the attemptResult to avoid storing multiple attempts per line.
      if (reviewState.attemptResult == null) {
        reviewState.setAttemptResult(true);
        storeAttemptResult(
          currentLineData.lineAndChapter.line,
          true,
          db.attempts,
        );
      }
    } else {
      // Otherwise, pick the opponent's next move in the line
      // Do this in a delay to simulate a game.
      setTimeout(async () => {
        const nextPosition = line.positions[nextLineIndex + 1];
        chessboardState.setNextPosition(nextPosition, false);
        currentLineData.setLineIndex(nextLineIndex + 1);
      }, OPPONENT_MOVE_DELAY);
    }

    // Return true to accept the move
    return true;
  }

  // If we got here, the move is not correct
  reviewState.setLineMoveResult("INCORRECT");
  if (reviewState.attemptResult == null) {
    reviewState.setAttemptResult(false);
    storeAttemptResult(currentLineData.lineAndChapter.line, false, db.attempts);
  }

  return false;
};

export interface ReviewLineProps {
  chessboardState: ChessboardState;
  studyData: StudyData;
  currentLineData: CurrentLineData;
  reviewState: ReviewState;
}

export const ReviewLine: React.FC<ReviewLineProps> = ({
  chessboardState,
  studyData,
  currentLineData,
  reviewState,
}) => {
  const clearLine = useCallback(() => {
    // Reset the game
    chessboardState.clearGame();
    currentLineData.setLineAndChapter(null);
    currentLineData.setLineIndex(-1);
  }, [chessboardState, currentLineData]);

  const initializeLine = useCallback(
    (lineAndChapter: LineAndChapter) => {
      const { line } = lineAndChapter;

      currentLineData.setLineAndChapter(lineAndChapter);
      chessboardState.setOrientation(line.orientation);

      // Initialize the first position
      chessboardState.setNextPosition(line.positions[0], true);
      currentLineData.setLineIndex((lineIndex: number) => lineIndex + 1);

      // If we are black, we first have to do white's move
      if (line.orientation == "b") {
        const firstPosition: Position = line.positions[1];
        chessboardState.setNextPosition(firstPosition, false);
        currentLineData.setLineIndex((lineIndex) => lineIndex + 1);
      }
    },
    [chessboardState, currentLineData],
  );

  const onNewLine = useCallback(() => {
    clearLine();
    reviewState.setAttemptResult(null);

    if (studyData.lines == null) {
      throw new Error("studyData.lines is null");
    }

    const line = pickLine(
      studyData.lines,
      "SPACED_REPITITION",
      studyData.attempts,
    );
    const chapter = studyData.chapters?.find(
      (chapter) => chapter.name == line.chapterName,
    );
    if (chapter == null) {
      throw new Error("chapter is null");
    }

    initializeLine({ line, chapter });
  }, [
    clearLine,
    initializeLine,
    reviewState,
    studyData.attempts,
    studyData.chapters,
    studyData.lines,
  ]);

  const onRestartLine = useCallback(() => {
    if (currentLineData.lineAndChapter == null) {
      throw new Error("line is null");
    }
    clearLine();
    initializeLine(currentLineData.lineAndChapter);
  }, [clearLine, currentLineData.lineAndChapter, initializeLine]);

  const arrows = useMemo(() => {
    if (currentLineData?.lineAndChapter?.line?.positions == null) {
      return [];
    }

    // If we're at the end othe line, we don't show arrows.
    if (
      currentLineData.lineIndex >=
      currentLineData.lineAndChapter.line.positions.length - 1
    ) {
      return [];
    }

    const lineSolution =
      currentLineData.lineAndChapter.line.positions[
        currentLineData.lineIndex + 1
      ].lastMove;

    if (lineSolution == null) {
      return [];
    }

    return [
      {
        from: lineSolution.from,
        to: lineSolution.to,
        color: "rgb(0, 100, 0)",
      },
    ];
  }, [currentLineData.lineAndChapter, currentLineData.lineIndex]);

  const toggleShowSolution = useCallback(() => {
    if (
      currentLineData.lineAndChapter == null ||
      currentLineData.lineIndex == -1
    ) {
      throw new Error("line is null");
    }

    const oldState = reviewState.showSolution;
    const newState = !oldState;

    if (newState) {
      chessboardState.setArrows(arrows);
    } else {
      chessboardState.setArrows([]);
    }

    reviewState.setShowSolution(newState);
  }, [
    arrows,
    chessboardState,
    currentLineData.lineAndChapter,
    currentLineData.lineIndex,
    reviewState,
  ]);

  const position = chessboardState.getPosition();

  return (
    <div>
      {studyData.selectedStudy != null && (
        <Controls
          lineStatus={currentLineData.lineStatus}
          onNewLine={onNewLine}
          onRestartLine={onRestartLine}
          toggleShowSolution={toggleShowSolution}
        />
      )}
      {position && (
        <MoveDescription
          position={position}
          status={currentLineData.lineStatus}
          result={reviewState.lineMoveResult || undefined}
        />
      )}
    </div>
  );
};
