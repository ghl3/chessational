import { Chapter } from "@/chess/Chapter";
import { Move } from "@/chess/Move";
import { Position } from "@/chess/Position";
import { Database } from "@/components/Database";
import { EngineEvaluation } from "@/components/EngineEvaluation";

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
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  chapter,
  position,
  gameMoves,
  engineData,
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

  // const width = Math.floor(0.75 * height);

  return (
    <div className="flex flex-col space-y-2 min-height:12px">
      <div className="flex flex-col flex-grow justify-start bg-gray-700 ">
        <div className="flex flex-row justify-between text-sm">
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
        </div>

        <PositionDescription position={position} gameMoves={gameMoves} />

        <ChapterInfo
          chapter={chapter}
          showChapter={showChapter}
          position={position}
        />

        {showEngine && position && (
          <EngineEvaluation position={position} engineData={engineData} />
        )}

        <Database showDatabase={showDatabase} position={position} />

        <CommentArea comments={comments} showComments={showComments} />

        {/* Spacer div will grow to fill space*/}
        <div className="flex-grow"></div>
      </div>
    </div>
  );
};
