import { storeAttemptResult } from "@/chess/Attempt";
import { Move } from "@/chess/Move";
import { Position } from "@/chess/Position";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { ReviewState } from "@/hooks/UseReviewState";
import { StudyData } from "@/hooks/UseStudyData";
import { pickLine } from "@/utils/LinePicker";
import { PieceSymbol, Square } from "chess.js";
import React, { useCallback, useMemo } from "react";
import { db } from "../app/db";
import { Controls } from "./Controls";
import { MoveDescription } from "./MoveDescription";

const OPPONENT_MOVE_DELAY = 250;

export const executeLegalMoveIfIsCorrect = (
  chessboardState: ChessboardState,
  reviewState: ReviewState,
  newPosition: Position,
  sourceSquare: Square,
  targetSquare: Square,
  promoteToPiece?: PieceSymbol,
): boolean => {
  if (reviewState.lineAndChapter == null) {
    window.alert('Please click "New Line" to start a new line.');
    return false;
  }

  const line = reviewState.lineAndChapter.line;
  const lineIndex = reviewState.lineIndex;

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
    // As a sanity check, make sure the next position in the line matches
    // the expected next position from the move
    if (newPosition.fen != line.positions[lineIndex + 1].fen) {
      throw new Error("newPosition does not match the expected next position");
    }

    // If it matches a child node, it's an acceptable move
    // and we update the current line and the board state.
    chessboardState.setNextPosition(line.positions[lineIndex + 1], false);
    chessboardState.setArrows([]);
    reviewState.setLineIndex(lineIndex + 1);
    reviewState.setLineMoveResult("CORRECT");
    reviewState.setShowSolution(false);

    // If this is the end of the line, we're done.
    // Otherwise, we play the opponent's next move and advance
    // to that position.
    const nextLineIndex = lineIndex + 1;
    const endOfLine = nextLineIndex == line.positions.length - 1;

    // If this is the end of the line, we're done.
    if (endOfLine) {
      // If we got to the end of the line without any attempt failures,
      // we mark the attempt as complete.
      // We check the attemptResult to avoid storing multiple attempts per line.
      if (reviewState.attemptResult == null) {
        reviewState.setAttemptResult(true);
        storeAttemptResult(reviewState.lineAndChapter.line, true, db.attempts);
      }
    } else {
      // Otherwise, pick the opponent's next move in the line
      // Do this in a delay to simulate a game.
      setTimeout(async () => {
        const nextPosition = line.positions[nextLineIndex + 1];
        chessboardState.setNextPosition(nextPosition, false);
        reviewState.setLineIndex(nextLineIndex + 1);
      }, OPPONENT_MOVE_DELAY);
    }

    // Return true to accept the move
    return true;
  }

  // If we got here, the move is not correct
  reviewState.setLineMoveResult("INCORRECT");
  if (reviewState.attemptResult == null) {
    reviewState.setAttemptResult(false);
    storeAttemptResult(reviewState.lineAndChapter.line, false, db.attempts);
  }

  return false;
};

export interface ReviewLineProps {
  chessboardState: ChessboardState;
  studyData: StudyData;
  reviewState: ReviewState;
}

export const ReviewLineControls: React.FC<ReviewLineProps> = ({
  chessboardState,
  studyData,
  reviewState,
}) => {
  const onNewLine = useCallback(() => {
    reviewState.clearLine(chessboardState);

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

    reviewState.initializeLine({ line, chapter }, chessboardState);
  }, [
    reviewState,
    chessboardState,
    studyData.lines,
    studyData.attempts,
    studyData.chapters,
  ]);

  const onRestartLine = useCallback(() => {
    if (reviewState.lineAndChapter == null) {
      throw new Error("line is null");
    }
    reviewState.clearLine(chessboardState);
    reviewState.initializeLine(reviewState.lineAndChapter, chessboardState);
  }, [chessboardState, reviewState]);

  const arrows = useMemo(() => {
    if (reviewState?.lineAndChapter?.line?.positions == null) {
      return [];
    }

    // If we're at the end othe line, we don't show arrows.
    if (
      reviewState.lineIndex >=
      reviewState.lineAndChapter.line.positions.length - 1
    ) {
      return [];
    }

    const lineSolution =
      reviewState.lineAndChapter.line.positions[reviewState.lineIndex + 1]
        .lastMove;

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
  }, [reviewState.lineAndChapter, reviewState.lineIndex]);

  const toggleShowSolution = useCallback(() => {
    if (reviewState.lineAndChapter == null || reviewState.lineIndex == -1) {
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
  }, [arrows, chessboardState, reviewState]);

  const position = chessboardState.getPosition();

  return (
    <div>
      {studyData.selectedStudy != null && (
        <Controls
          lineStatus={reviewState.lineStatus}
          onNewLine={onNewLine}
          onRestartLine={onRestartLine}
          toggleShowSolution={toggleShowSolution}
        />
      )}
      {position && (
        <MoveDescription
          position={position}
          status={reviewState.lineStatus}
          result={reviewState.lineMoveResult || undefined}
        />
      )}
    </div>
  );
};
