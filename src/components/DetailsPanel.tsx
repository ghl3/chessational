import { Chapter } from "@/chess/Chapter";
import { LineStatus } from "@/chess/Line";
import { Move } from "@/chess/Move";
import { Position } from "@/chess/Position";
import { Database } from "@/components/Database";
import { EngineEvaluation } from "@/components/EngineEvaluation";
import { LineMoveResult, MoveDescription } from "@/components/MoveDescription";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { useCallback, useState } from "react";
import ChapterInfo from "./ChapterInfo";
import CommentArea from "./CommentArea";
import { ControlButton } from "./ControlButton";
import { PositionDescription } from "./PositionDescription";
import { SwitchButton } from "./SwitchButton";

export interface DetailsPanelProps {
  chapter?: Chapter;
  position?: Position;
  gameMoves: Move[];
  positionEvaluation: EvaluatedPosition | null;
  moveResult: LineMoveResult | null;
  lineStatus: LineStatus | undefined;

  onToggleShowEngine: (showEngine: boolean) => void;

  height: number;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  chapter,
  position,
  gameMoves,
  positionEvaluation,
  moveResult,
  lineStatus,
  onToggleShowEngine,
  height,
}) => {
  const comments = position?.comments || [];

  const [showEngine, setShowEngine] = useState<boolean>(false);
  const [showDatabase, setShowDatabase] = useState<boolean>(false);
  const [showChapter, setShowChapter] = useState(false);
  const [showComments, setShowComments] = useState<boolean>(false);

  const toggleShowChapter = useCallback(() => {
    setShowChapter((showChapter) => !showChapter);
  }, []);

  const toggleShowEngine = useCallback(() => {
    setShowEngine((showEngine) => !showEngine);
    onToggleShowEngine(!showEngine);
  }, [showEngine, onToggleShowEngine]);

  const toggleDatabase = useCallback(() => {
    setShowDatabase((showDatabase) => !showDatabase);
  }, []);

  const toggleShowComments = useCallback(() => {
    setShowComments((showComments) => !showComments);
  }, []);

  return (
    <div
      className="flex flex-col w-1/3 ml-6 space-y-2 "
      style={{ height: height ? `${height}px` : "auto" }}
    >
      <div className="flex flex-row space-x-1">
        <SwitchButton
          onChange={toggleShowEngine}
          checked={showEngine}
          label="Engine"
        />
        <SwitchButton
          onChange={toggleDatabase}
          checked={showDatabase}
          label="Database"
        />
        <SwitchButton
          onChange={toggleShowChapter}
          checked={showChapter}
          label="Chapter"
        />
        <SwitchButton
          onChange={toggleShowComments}
          checked={showComments}
          label="Comments"
        />
      </div>

      <div className="flex flex-col flex-grow justify-start bg-gray-700 ">
        <ChapterInfo
          chapter={chapter}
          showChapter={showChapter}
          position={position}
        />

        <EngineEvaluation
          showEngine={showEngine}
          positionEvaluation={positionEvaluation || undefined}
        />

        <Database showDatabase={showDatabase} position={position} />

        <CommentArea comments={comments} showComments={showComments} />

        <MoveDescription
          position={position}
          status={lineStatus}
          result={moveResult || undefined}
        />

        {/* Spacer div will grow to fill space*/}
        <div className="flex-grow"></div>

        <PositionDescription position={position} gameMoves={gameMoves} />
      </div>
    </div>
  );
};
