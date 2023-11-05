import { PositionEvaluation } from "@/components/PositionEvaluation";
import { Database } from "@/components/Database";
import { LineMoveResult, MoveDescription } from "@/components/MoveDescription";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { LineStatus } from "@/chess/Line";
import CommentArea from "./CommentArea";
import { ControlButton } from "./ControlButton";
import { Position } from "@/chess/Position";
import { useCallback, useState } from "react";
import { Chapter } from "@/chess/Chapter";

export interface DetailsPanelProps {
  chapter?: Chapter;
  position: Position;
  positionEvaluation: EvaluatedPosition | null;
  moveResult: LineMoveResult | null;
  lineStatus: LineStatus | undefined;

  onToggleShowEngine: (showEngine: boolean) => void;

  height: number;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  chapter,
  position,
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
  }, [showChapter]);

  const toggleShowEngine = useCallback(() => {
    setShowEngine((showEngine) => !showEngine);
    onToggleShowEngine(!showEngine);
  }, [showEngine, onToggleShowEngine]);

  const toggleDatabase = useCallback(() => {
    setShowDatabase((showDatabase) => !showDatabase);
  }, [showDatabase]);

  const toggleShowComments = useCallback(() => {
    setShowComments((showComments) => !showComments);
  }, [showComments]);

  return (
    <div
      className="flex flex-col w-1/3 ml-6 space-y-2"
      style={{ height: height ? `${height}px` : "auto" }}
    >
      <div className="flex flex-row space-x-1 ">
        <ControlButton
          onClick={toggleShowEngine}
          label={showEngine ? "Hide Engine" : "Show Engine"}
          size={"small"}
        />
        <ControlButton
          onClick={toggleDatabase}
          label={showDatabase ? "Hide Database" : "Show Database"}
          size={"small"}
        />
        <ControlButton
          onClick={toggleShowChapter}
          label={showChapter ? "Hide Chapter" : "Show Chapter"}
          size={"small"}
        />
        <ControlButton
          onClick={toggleShowComments}
          label={showComments ? "Hide Comments" : "Show Comments"}
          size={"small"}
        />
      </div>

      <div className="flex flex-col flex-grow justify-start bg-gray-700 ">
        <MoveDescription
          position={position}
          status={lineStatus}
          result={moveResult || undefined}
        />

        <PositionEvaluation
          showEngine={showEngine}
          positionEvaluation={positionEvaluation || undefined}
        />

        <Database showDatabase={showDatabase} position={position} />

        {showChapter && chapter && <div>{chapter.name}</div>}

        <CommentArea comments={comments} showComments={showComments} />
      </div>
    </div>
  );
};
