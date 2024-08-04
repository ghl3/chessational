import { Chapter } from "@/chess/Chapter";
import { LineStatus } from "@/chess/Line";
import { Move } from "@/chess/Move";
import { Position } from "@/chess/Position";
import { Database } from "@/components/Database";
import { EngineEvaluation } from "@/components/EngineEvaluation";
import { LineMoveResult, MoveDescription } from "@/components/MoveDescription";
import { EvaluatedPosition } from "@/engine/EvaluatedPosition";
import { EngineData } from "@/hooks/UseEngineData";
import { useCallback, useState } from "react";
import ChapterInfo from "./ChapterInfo";
import CommentArea from "./CommentArea";
import { PositionDescription } from "./PositionDescription";
import { SwitchButton } from "./SwitchButton";

export interface DetailsPanelProps {
  chapter?: Chapter;
  position?: Position;
  gameMoves: Move[];
  engineData: EngineData;
  moveResult: LineMoveResult | null;
  lineStatus: LineStatus | undefined;
  height: number;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  chapter,
  position,
  gameMoves,
  engineData,
  moveResult,
  lineStatus,
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
    engineData.setRunEngine((runEngine) => !runEngine);
  }, [engineData]);

  const toggleDatabase = useCallback(() => {
    setShowDatabase((showDatabase) => !showDatabase);
  }, []);

  const toggleShowComments = useCallback(() => {
    setShowComments((showComments) => !showComments);
  }, []);

  const width = Math.floor(0.75 * height);

  return (
    <div
      className="flex flex-col w-1/3  space-y-2 "
      style={{
        height: height ? `${height}px` : "auto",
        minWidth: `${width}px`,
      }}
    >
      <div className="flex flex-col flex-grow justify-start bg-gray-700 ">
        <div className="flex flex-row justify-between text-sm">
          <SwitchButton
            onChange={toggleShowEngine}
            checked={showEngine}
            label="Engine"
            labelPosition="top"
            size="medium"
          />
          <SwitchButton
            onChange={toggleDatabase}
            checked={showDatabase}
            label="Database"
            labelPosition="top"
            size="medium"
          />
          <SwitchButton
            onChange={toggleShowChapter}
            checked={showChapter}
            label="Chapter"
            labelPosition="top"
            size="medium"
          />
          <SwitchButton
            onChange={toggleShowComments}
            checked={showComments}
            label="Comments"
            labelPosition="top"
            size="medium"
          />
        </div>

        <ChapterInfo
          chapter={chapter}
          showChapter={showChapter}
          position={position}
        />

        {showEngine && position && (
          <EngineEvaluation
            position={position}
            engineData={engineData}
            //showEngine={showEngine}
            //positionEvaluation={positionEvaluation || undefined}
          />
        )}

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
