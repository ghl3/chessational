import { Position } from "@/chess/Position";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { Engine } from "@/engine/Engine";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { ChessboardState } from "@/hooks/UseChessboardState";
import useEvaluationCache from "@/hooks/UseEvaluationCache";
import { useStudyData } from "@/hooks/UseStudyData";
import { PieceSymbol, Square } from "chess.js";
import React, {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

import { MoveValidator } from "./Chessboard";
import { StudyChapterSelector } from "./StudyChapterSelector";

const OPPONENT_MOVE_DELAY = 250;

// Only run the engine on the client.
let engine: Engine | null = null;
if (typeof window !== "undefined") {
  engine = new Engine(new Worker("/stockfish/stockfish.asm.js"), 20, 3, false);
}

export interface ExploreProps {
  chessboardState: ChessboardState;
  onValidPieceDropRef: MutableRefObject<MoveValidator | null>;
  lineAndChapter: LineAndChapter | null;
  setLineAndChapter: (lineAndChapter: LineAndChapter | null) => void;
  lineIndex: number;
  setLineIndex: Dispatch<SetStateAction<number>>;
  height?: number;
}

export const Explore: React.FC<ExploreProps> = ({
  chessboardState,
  onValidPieceDropRef,
  lineAndChapter,
  setLineAndChapter,
  lineIndex,
  setLineIndex,
  height,
}) => {
  const studyData = useStudyData();

  /*
  const enterLineMode = useCallback(() => {
    if (mode == "EXPLORE") {
      chessboardState.clearGame();

      // Recreate the original line
      if (lineAndChapter != null) {
        for (const position of lineAndChapter.line.positions.slice(
          0,
          lineIndex + 1,
        )) {
          chessboardState.setNextPosition(position, true);
        }
      }
    }
    setMode("LINE");
    setSolution(null);
  }, [lineAndChapter, lineIndex, mode, chessboardState]);
  */

  const clearLine = useCallback(() => {
    // Reset the game
    chessboardState.clearGame();
    setLineAndChapter(null);
    setLineIndex(-1);
  }, [chessboardState, setLineAndChapter, setLineIndex]);

  const initializeLine = useCallback(
    (lineAndChapter: LineAndChapter) => {
      const { line } = lineAndChapter;

      // enterLineMode();

      setLineAndChapter(lineAndChapter);
      chessboardState.setOrientation(line.orientation);

      // Initialize the first position
      chessboardState.setNextPosition(line.positions[0], true);
      setLineIndex((lineIndex: number) => lineIndex + 1);

      // If we are black, we first have to do white's move
      if (line.orientation == "b") {
        const firstPosition: Position = line.positions[1];
        chessboardState.setNextPosition(firstPosition, false);
        setLineIndex((lineIndex) => lineIndex + 1);
      }
    },
    [chessboardState, setLineAndChapter, setLineIndex],
  );

  const onValidPieceDrop = useCallback(
    (
      newPosition: Position,
      sourceSquare: Square,
      targetSquare: Square,
      promoteToPiece?: PieceSymbol,
    ): boolean => {
      // TODO: Check if this is a line
      // or if it transposes to a line.
      return true;
    },
    [],
  );

  //setOnValidPieceDrop(onValidPieceDrop);

  /*
  const onPieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square, piece: string): boolean => {
      const originalPiece: PieceSymbol | null =
        chessboardState.getPieceAtSquare(sourceSquare);
      if (originalPiece == null) {
        throw new Error("originalPiece is null");
      }

      const promoteToPiece = getPromoteToPiece(
        sourceSquare,
        targetSquare,
        originalPiece,
        convertToPieceSymbol(piece),
      );

      const [move, newPosition]: [Move | null, Position | null] =
        chessboardState.createMoveOrNull(
          sourceSquare,
          targetSquare,
          promoteToPiece,
        ) || [null, null];

      if (move == null || newPosition == null) {
        return false;
      }

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
      chessboardState,
      mode,
      lineAndChapter,
      lineIndex,
      setLineMoveResult,
      attemptResult,
      setLineIndex,
      playOpponentNextMoveIfLineContinues,
    ],
  );
*/

  const position = chessboardState.getPosition();

  const [getEvaluation, addEvaluation] = useEvaluationCache();

  const positionEvaluation = position ? getEvaluation(position.fen) : null;

  useEffect(() => {
    if (engine) {
      engine.listener = (evaluation: EvaluatedPosition) => {
        addEvaluation(evaluation);
      };
    }
  }, [addEvaluation]);

  const [runEngine, setRunEngine] = useState<boolean>(false);
  const onToggleShowEngine = useCallback((showEngine: boolean) => {
    setRunEngine(showEngine);
  }, []);

  //if (lineAndChapter == null) {
  //  onNewLine();
  //}

  return (
    <div>
      <StudyChapterSelector studyData={studyData} />
    </div>
  );
};
