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

  const [showPgn, setShowPgn] = useState<boolean>(false);
  const [showEngine, setShowEngine] = useState<boolean>(false);
  const [showDatabase, setShowDatabase] = useState<boolean>(false);
  const [showChapter, setShowChapter] = useState(false);
  const [showComments, setShowComments] = useState<boolean>(false);

  const toggleShowPgn = useCallback(() => {
    setShowPgn((showPgn) => !showPgn);
  }, []);

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

  return (
    <div className="flex flex-col space-y-2 min-h-12 max-w-3xl">
      <div className="flex flex-col flex-grow justify-start bg-gray-700 p-4 w-full">
        <div className="flex flex-row gap-8 text-sm max-w-3xl">
          <SwitchButton
            onChange={toggleShowChapter}
            checked={showChapter}
            label="Chapter"
            labelPosition="top"
            size="medium"
          />
          <SwitchButton
            onChange={toggleShowPgn}
            checked={showPgn}
            label="PGN"
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

        {showChapter && chapter && (
          <ChapterInfo chapter={chapter} position={position} />
        )}

        {showPgn && position && (
          <PositionDescription position={position} gameMoves={gameMoves} />
        )}

        {showEngine && position && (
          <EngineEvaluation position={position} engineData={engineData} />
        )}

        {showDatabase && position && <Database position={position} />}

        {showComments && comments && comments.length > 0 && (
          <CommentArea comments={comments} />
        )}

        {/* Spacer div will grow to fill space*/}
        <div className="flex-grow"></div>
      </div>
    </div>
  );
};
