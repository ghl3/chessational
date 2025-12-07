import { ChessboardState } from "@/hooks/UseChessboardState";
import { EngineData } from "@/hooks/UseEngineData";
import { ReviewState } from "@/hooks/UseReviewState";
import { StudyData } from "@/hooks/UseStudyData";
import { Dispatch, SetStateAction, useMemo, memo } from "react";
import { Attempts } from "./Attempts";
import Lines from "./Lines";
import { NavBar, Tab } from "./NavBar";
import OpeningTree from "./OpeningTree";
import { Review } from "./Review";
import { Studies } from "./Studies";
import { StudyChapterSelector } from "./StudyChapterSelector";

interface RightPanelProps {
  tab: Tab;
  setTab: Dispatch<SetStateAction<Tab>>;
  chessboardState: ChessboardState;
  studyData: StudyData;
  engineData: EngineData;
  reviewState: ReviewState;
}

export const RightPanel: React.FC<RightPanelProps> = memo(({
  tab,
  setTab,
  chessboardState,
  studyData,
  engineData,
  reviewState,
}) => {
  const lines = useMemo(() => studyData.lines || [], [studyData.lines]);
  const chapters = useMemo(() => studyData.chapters || [], [studyData.chapters]);
  const attempts = useMemo(() => studyData.attempts || [], [studyData.attempts]);
  const showChapterSelector = useMemo(() => tab !== "STUDIES", [tab]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Navigation - Fixed at top */}
      <div className="flex-none">
        <NavBar mode={tab} setMode={setTab} />
      </div>

      {/* Chapter Selector - Fixed below nav for relevant tabs */}
      {showChapterSelector && (
        <div className="flex-none">
          <StudyChapterSelector studyData={studyData} />
        </div>
      )}

      {/* Main Content Area - Scrollable per tab requirement */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        {tab === "REVIEW" && (
          <div className="absolute inset-0 overflow-y-auto p-3">
            <Review
              chessboardState={chessboardState}
              studyData={studyData}
              engineData={engineData}
              reviewState={reviewState}
              onNavigateToStudies={() => setTab("STUDIES")}
            />
          </div>
        )}
        
        {tab === "STUDIES" && (
          <div className="absolute inset-0 overflow-y-auto p-3">
            <Studies studyData={studyData} />
          </div>
        )}

        {tab === "LINES" && (
          <div className="absolute inset-0 p-3 flex flex-col">
            <Lines
              lines={lines}
              chapters={chapters}
              attempts={attempts}
              chessboardState={chessboardState}
            />
          </div>
        )}

        {tab === "ATTEMPTS" && (
          <div className="absolute inset-0 overflow-y-auto p-3">
            <Attempts
              lines={lines}
              chapters={chapters}
              attempts={attempts}
              chessboardState={chessboardState}
            />
          </div>
        )}

        {tab === "TREE" && (
          <div className="absolute inset-0 p-3 flex flex-col">
            <OpeningTree
              chapters={chapters || []}
              onNodeSelect={(position) => {
                chessboardState.setNextPosition(position, true);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
});

RightPanel.displayName = "RightPanel";
