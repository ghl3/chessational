import { Move } from "@/chess/Move";
import { PositionEvaluation } from "@/components/PositionEvaluation";
import { Database } from "@/components/Database";
import { LineMoveResult, MoveDescription } from "@/components/MoveDescription";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { Fen } from "@/chess/Fen";
import { LineStatus } from "@/chess/Line";
import CommentArea from "./CommentArea";

export interface DetailsPanelProps {
  height: number;
  showEngine: boolean;
  positionEvaluation: EvaluatedPosition | null;
  showDatabase: boolean;
  moveResult: LineMoveResult | null;
  comments: string[];
  position: Fen;
  move: Move;
  lineStatus: LineStatus | undefined;
  showComments: boolean;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  height,
  showEngine,
  positionEvaluation,
  showDatabase,
  moveResult,
  comments,
  position,
  move,
  lineStatus,
  showComments,
}) => {
  return (
    <div
      className="w-1/3 ml-6 space-y-6 bg-gray-700 "
      style={{ height: height ? `${height}px` : "auto" }}
    >
      <MoveDescription
        move={move}
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
  );
};
