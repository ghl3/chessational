import { ChessboardState } from "@/hooks/UseChessboardState";
import { EngineData } from "@/hooks/UseEngineData";
import { ReviewState } from "@/hooks/UseReviewState";
import { StudyData } from "@/hooks/UseStudyData";
import { Dispatch, SetStateAction } from "react";
import { Attempts } from "./Attempts";
import Lines from "./Lines";
import { NavBar, Tab } from "./NavBar";
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

export const RightPanel: React.FC<RightPanelProps> = ({
  tab,
  setTab,
  chessboardState,
  studyData,
  engineData,
  reviewState,
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-gray-800 rounded-lg">
      <NavBar mode={tab} setMode={setTab} />
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {tab !== "STUDIES" && <StudyChapterSelector studyData={studyData} />}
          {tab === "REVIEW" && (
            <Review
              chessboardState={chessboardState}
              studyData={studyData}
              engineData={engineData}
              reviewState={reviewState}
            />
          )}
          {tab === "STUDIES" && <Studies studyData={studyData} />}
          {tab === "LINES" && (
            <Lines
              lines={studyData.lines || []}
              chapters={studyData.chapters || []}
              attempts={studyData.attempts || []}
              chessboardState={chessboardState}
            />
          )}

          {tab === "ATTEMPTS" && (
            <Attempts
              lines={studyData.lines || []}
              chapters={studyData.chapters || []}
              attempts={studyData.attempts || []}
              chessboardState={chessboardState}
            />
          )}
        </div>
      </div>
    </div>
  );
};
