import { Chapter } from "@/chess/Chapter";
import { Position } from "@/chess/Position";
import { Database } from "@/components/Database";
import { EngineEvaluation } from "@/components/EngineEvaluation";

import { EngineData } from "@/hooks/UseEngineData";
import { useCallback, useState, useMemo, memo } from "react";
import ChapterInfo from "./ChapterInfo";
import CommentArea from "./CommentArea";
import { PositionDescription } from "./PositionDescription";
import { SwitchButton } from "./SwitchButton";

export interface DetailsPanelProps {
  chapter?: Chapter;
  currentPosition?: Position;
  positions: Position[];
  engineData: EngineData;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = memo(({
  chapter,
  currentPosition,
  positions,
  engineData,
}) => {
  const comments = useMemo(
    () => currentPosition?.comments || [],
    [currentPosition],
  );

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

  const hasExpandedContent = showChapter || showEngine || showPgn || showDatabase || (showComments && comments.length > 0);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-700 p-3">
      <div className="flex flex-wrap gap-3">
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

      {hasExpandedContent && (
        <div className="flex flex-col gap-3 pt-2 border-t border-gray-700">
          {showChapter && chapter && (
            <ChapterInfo chapter={chapter} position={currentPosition} />
          )}
          {showEngine && currentPosition && (
            <EngineEvaluation
              position={currentPosition}
              engineData={engineData}
            />
          )}
          {showPgn && currentPosition && (
            <PositionDescription
              currentPosition={currentPosition}
              positions={positions}
            />
          )}
          {showDatabase && currentPosition && (
            <Database position={currentPosition} />
          )}
          {showComments && comments && comments.length > 0 && (
            <CommentArea comments={comments} />
          )}
        </div>
      )}
    </div>
  );
});

DetailsPanel.displayName = "DetailsPanel";
