import { storeAttemptResult } from "@/chess/Attempt";
import { LineStatus } from "@/chess/Line";
import { Move } from "@/chess/Move";
import { Position } from "@/chess/Position";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { EngineData } from "@/hooks/UseEngineData";
import { ReviewState } from "@/hooks/UseReviewState";
import { StudyData } from "@/hooks/UseStudyData";
import { pickLine } from "@/utils/LinePicker";
import { PieceSymbol, Square } from "chess.js";
import { default as React, useCallback, useMemo } from "react";
import { db } from "../app/db";
import { ControlButton } from "./ControlButton";
import { DetailsPanel } from "./DetailsPanel";
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
  if (reviewState.lineAndChapter === null) {
    window.alert('Please click "New Line" to start a new line.');
    return false;
  }

  const line = reviewState.lineAndChapter.line;
  const lineIndex = reviewState.lineIndex;

  // If the current board position is not the next position in the line,
  // we don't accept the move.  This can happen if the user uses
  // the left/right arrows to move around the line and then tries to move
  // when not in the latest position in the line.
  if (line.positions[lineIndex] !== chessboardState.getCurrentPosition()) {
    reviewState.setLineMoveResult(null);
    return false;
  }

  // Check whether the attempted move is the next move in the line.
  const nextMoveInLine: Move | null = line.positions[lineIndex + 1].lastMove;
  if (nextMoveInLine === null) {
    throw new Error("nextMoveInLine is null");
  }

  if (
    nextMoveInLine.from === sourceSquare &&
    nextMoveInLine.to === targetSquare &&
    (promoteToPiece || null) === (nextMoveInLine.promotion || null)
  ) {
    // As a sanity check, make sure the next position in the line matches
    // the expected next position from the move
    if (newPosition.fen !== line.positions[lineIndex + 1].fen) {
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
    const endOfLine = nextLineIndex === line.positions.length - 1;

    // If this is the end of the line, we're done.
    if (endOfLine) {
      // If we got to the end of the line without any attempt failures,
      // we mark the attempt as complete.
      // We check the attemptResult to avoid storing multiple attempts per line.
      if (reviewState.attemptResult === null) {
        reviewState.setAttemptResult(true);
        storeAttemptResult(reviewState.lineAndChapter.line, true, db.attempts);
      }

      return true;
    } else {
      // Otherwise, pick the opponent's next move in the line
      // Do this in a delay to simulate a game.
      setTimeout(async () => {
        const nextPosition = line.positions[nextLineIndex + 1];
        chessboardState.setNextPosition(nextPosition, false);
        reviewState.setLineIndex(nextLineIndex + 1);
      }, OPPONENT_MOVE_DELAY);
    }

    return true;
  } else {
    // If we got here, the move is not correct
    reviewState.setLineMoveResult("INCORRECT");
    if (reviewState.attemptResult === null) {
      reviewState.setAttemptResult(false);
      storeAttemptResult(reviewState.lineAndChapter.line, false, db.attempts);
    }
    return true;
  }
};

type ControlProps = {
  lineStatus?: LineStatus;
  toggleShowSolution: () => void;
  onNewLine: () => void;
  onRestartLine: () => void;
  hasLines: boolean;
};

const Controls: React.FC<ControlProps> = ({
  lineStatus,
  onNewLine,
  onRestartLine,
  toggleShowSolution,
  hasLines,
}) => {
  const hasActiveLine = lineStatus !== undefined;

  const lineIsComplete = lineStatus === "LINE_COMPLETE";

  return (
    <div className="p-2 space-y-6">
      <div className="flex flex-row justify-start space-x-4">
        <ControlButton
          onClick={onNewLine}
          label="New Line"
          size={"large"}
          disabled={!hasLines}
        />

        {hasActiveLine ? (
          <ControlButton
            onClick={onRestartLine}
            label="Restart Line"
            size={"large"}
          />
        ) : null}

        {hasActiveLine && !lineIsComplete ? (
          <ControlButton
            onClick={toggleShowSolution}
            label="Show Solution"
            size={"large"}
            disabled={lineIsComplete}
          />
        ) : null}
      </div>
    </div>
  );
};

export interface ReviewOrExploreLineProps {
  chessboardState: ChessboardState;
  studyData: StudyData;
  engineData: EngineData;
  reviewState: ReviewState;
  onNavigateToStudies?: () => void;
}

export const Review: React.FC<ReviewOrExploreLineProps> = ({
  chessboardState,
  studyData,
  engineData,
  reviewState,
  onNavigateToStudies,
}) => {
  const position = chessboardState.getCurrentPosition();

  // Check if we have the necessary data
  const hasStudies = studyData.studies && studyData.studies.length > 0;
  const hasSelectedStudy = studyData.selectedStudy !== undefined && studyData.selectedStudy !== null;
  const hasSelectedChapters =
    studyData.selectedChapterNames !== undefined &&
    studyData.selectedChapterNames !== null &&
    studyData.selectedChapterNames.length > 0;
  const hasLines =
    studyData.lines !== null &&
    studyData.lines !== undefined &&
    studyData.lines.length > 0;

  const onNewLine = useCallback(() => {
    reviewState.clearLine(chessboardState);

    if (studyData.lines === null || studyData.lines === undefined || studyData.lines.length === 0) {
      window.alert(
        "No lines available. Please select a study and at least one chapter to review.",
      );
      return;
    }

    const line = pickLine(
      studyData.lines,
      "SPACED_REPETITION",
      studyData.attempts,
    );
    const chapter = studyData.chapters?.find(
      (chapter) => chapter.name === line.chapterName,
    );
    if (chapter === null || chapter === undefined) {
      window.alert(
        `Chapter "${line.chapterName}" not found. Please ensure the study data is properly loaded.`,
      );
      return;
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
    if (reviewState.lineAndChapter === null) {
      throw new Error("line is null");
    }
    reviewState.clearLine(chessboardState);
    reviewState.initializeLine(reviewState.lineAndChapter, chessboardState);
  }, [chessboardState, reviewState]);

  const arrows = useMemo(() => {
    if (reviewState.lineAndChapter === null) {
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

    if (lineSolution === null) {
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
    if (reviewState.lineAndChapter === null || reviewState.lineIndex === -1) {
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

  // Show helpful message if no studies or lines are available
  if (!hasStudies) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-gray-700 rounded-lg p-6 max-w-md">
          <h3 className="text-xl font-semibold text-white mb-4">
            No Studies Available
          </h3>
          <p className="text-gray-300 mb-6">
            You need to add a study before you can review lines. Go to the
            Studies tab to add a Lichess study.
          </p>
          {onNavigateToStudies && (
            <button
              onClick={onNavigateToStudies}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Go to Studies Tab
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!hasSelectedStudy) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-gray-700 rounded-lg p-6 max-w-md">
          <h3 className="text-xl font-semibold text-white mb-4">
            No Study Selected
          </h3>
          <p className="text-gray-300 mb-6">
            Please select a study from the dropdown above, or go to the Studies
            tab to add a new study.
          </p>
          {onNavigateToStudies && (
            <button
              onClick={onNavigateToStudies}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Go to Studies Tab
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!hasSelectedChapters) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-gray-700 rounded-lg p-6 max-w-md">
          <h3 className="text-xl font-semibold text-white mb-4">
            No Chapters Selected
          </h3>
          <p className="text-gray-300 mb-6">
            Please select at least one chapter from the dropdown above to start
            reviewing lines.
          </p>
        </div>
      </div>
    );
  }

  if (!hasLines) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-gray-700 rounded-lg p-6 max-w-md">
          <h3 className="text-xl font-semibold text-white mb-4">
            No Lines Available
          </h3>
          <p className="text-gray-300 mb-6">
            The selected chapters don't have any lines to review. Try selecting
            different chapters or add a new study.
          </p>
          {onNavigateToStudies && (
            <button
              onClick={onNavigateToStudies}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Go to Studies Tab
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Controls
        lineStatus={reviewState.lineStatus}
        onNewLine={onNewLine}
        onRestartLine={onRestartLine}
        toggleShowSolution={toggleShowSolution}
        hasLines={hasLines}
      />

      {position && (
        <MoveDescription
          status={reviewState.lineStatus}
          result={reviewState.lineMoveResult || undefined}
        />
      )}

      <DetailsPanel
        chapter={reviewState.lineAndChapter?.chapter || undefined}
        currentPosition={position || undefined}
        positions={chessboardState.positions}
        engineData={engineData}
      />
    </div>
  );
};
