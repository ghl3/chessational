import { PositionEvaluation } from "@/components/PositionEvaluation";
import { Database } from "@/components/Database";
import { LineMoveResult, MoveDescription } from "@/components/MoveDescription";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { LineStatus } from "@/chess/Line";
import CommentArea from "./CommentArea";
import { ControlButton } from "./ControlButton";
import { Position } from "@/chess/Position";
import { useState } from "react";
import { Chapter } from "@/chess/Chapter";

export interface DetailsPanelProps {
  chapter?: Chapter;
  position: Position;
  positionEvaluation: EvaluatedPosition | null;
  moveResult: LineMoveResult | null;
  lineStatus: LineStatus | undefined;

  showEngine: boolean;
  showDatabase: boolean;
  showComments: boolean;
  engineIsEnabled: boolean;
  databaseIsEnabled: boolean;
  //  comments: string[];

  onShowComments: () => void;
  toggleEngine: () => void;
  toggleDatabase: () => void;

  height: number;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  chapter,
  position,
  positionEvaluation,
  moveResult,
  lineStatus,

  showEngine,
  showDatabase,
  showComments,
  engineIsEnabled,
  databaseIsEnabled,
  //  comments: string[];

  onShowComments,
  toggleEngine,
  toggleDatabase,

  height,
}) => {
  const comments = position?.comments || [];

  const [showChapter, setShowChapter] = useState(false);

  const toggleShowChapter = () => {
    setShowChapter((showChapter) => !showChapter);
  };

  return (
    <div
      className="flex flex-col w-1/3 ml-6 space-y-2"
      style={{ height: height ? `${height}px` : "auto" }}
    >
      <div className="flex flex-row space-x-1 ">
        <ControlButton
          onClick={toggleEngine}
          label={engineIsEnabled ? "Hide Engine" : "Show Engine"}
          size={"small"}
        />
        <ControlButton
          onClick={toggleDatabase}
          label={databaseIsEnabled ? "Hide Database" : "Show Database"}
          size={"small"}
        />
        <ControlButton
          onClick={toggleShowChapter}
          label="Show Chapter"
          size={"small"}
        />
        <ControlButton
          onClick={onShowComments}
          label="Show Comments"
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
        <Database showDatabase={showDatabase} position={position} />

        <CommentArea comments={comments} showComments={showComments} />
      </div>
    </div>
  );
};
