import { Move } from "@/chess/Move";
import { PositionEvaluation } from "@/components/PositionEvaluation";
import { Database } from "@/components/Database";
import { LineMoveResult, MoveDescription } from "@/components/MoveDescription";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { Fen } from "@/chess/Fen";
import { LineStatus } from "@/chess/Line";
import CommentArea from "./CommentArea";
import { ControlButton } from "./ControlButton";

export interface DetailsPanelProps {
  height: number;
  showEngine: boolean;
  positionEvaluation: EvaluatedPosition | null;
  showDatabase: boolean;
  moveResult: LineMoveResult | null;
  comments: string[];
  position: Fen;

  lineStatus: LineStatus | undefined;
  showComments: boolean;
  onShowComments: () => void;
  engineIsEnabled: boolean;
  toggleEngine: () => void;
  databaseIsEnabled: boolean;
  toggleDatabase: () => void;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  height,
  showEngine,
  positionEvaluation,
  showDatabase,
  moveResult,
  comments,
  position,

  lineStatus,
  showComments,

  onShowComments,
  engineIsEnabled,
  toggleEngine,
  databaseIsEnabled,
  toggleDatabase,
}) => {
  return (
    <div
      className="flex flex-col w-1/3 ml-6 space-y-2"
      style={{ height: height ? `${height}px` : "auto" }}
    >
      <div className="flex flex-row space-x-1 ">
        <ControlButton
          onClick={toggleEngine}
          label={engineIsEnabled ? "Hide Engine" : "Show Engine"}
        />
        <ControlButton
          onClick={toggleDatabase}
          label={databaseIsEnabled ? "Hide Database" : "Show Database"}
        />
        <ControlButton onClick={onShowComments} label="Show Comments" />
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

        <CommentArea comments={comments} showComments={showComments} />
      </div>
    </div>
  );
};
