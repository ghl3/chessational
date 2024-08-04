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

export const Explore: React.FC<ExploreProps> = ({ chessboardState }) => {
  const studyData = useStudyData();

  const position = chessboardState.getPosition();

  const [getEvaluation, addEvaluation] = useEvaluationCache();

  useEffect(() => {
    if (engine) {
      engine.listener = (evaluation: EvaluatedPosition) => {
        addEvaluation(evaluation);
      };
    }
  }, [addEvaluation]);

  const [runEngine, setRunEngine] = useState<boolean>(false);

  //if (lineAndChapter == null) {
  //  onNewLine();
  //}

  return (
    <div>
      <StudyChapterSelector studyData={studyData} />
    </div>
  );
};
