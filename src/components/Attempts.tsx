import { Attempt } from "@/chess/Attempt";
import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { EngineData } from "@/hooks/UseEngineData";
import { ReviewState } from "@/hooks/UseReviewState";
import { createColumnHelper } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import { DetailsPanel } from "./DetailsPanel";
import DynamicTable, {
  BASE_COLUMN_WIDTHS,
  ClickableLineFn,
} from "./DynamicTable";
import { makePositionChips } from "./PositionChip";

export interface AttemptRow {
  studyName: string;
  chapterName: string;
  line: React.JSX.Element[];
  attemptDate: Date | null;
  correct: boolean;
}

interface AttemptsProps {
  lines: Line[];
  chapters: Chapter[];
  attempts: Attempt[];
  chessboardState: ChessboardState;
  engineData: EngineData;
  reviewState: ReviewState;
}

export const Attempts: React.FC<AttemptsProps> = ({
  lines,
  chapters,
  attempts,
  chessboardState,
  engineData,
  reviewState,
}) => {
  const handleLineSelect = useCallback(
    (lineAndChapter: LineAndChapter) => {
      reviewState.setLineAndChapter(lineAndChapter);
    },
    [reviewState],
  );

  const lineAndChapters = useMemo(() => {
    if (lines === undefined || chapters === undefined) {
      return [];
    }

    return lines.flatMap((line) => {
      const chapter = chapters.find(
        (chapter) => chapter.name === line.chapterName,
      );
      if (chapter === undefined) {
        // Chapter not found - skip this line
        return [];
      }
      return [
        {
          line: line,
          chapter: chapter,
        },
      ];
    });
  }, [lines, chapters]);

  const attemptRows: AttemptRow[] = useMemo(() => {
    return attempts
      ?.map((attempt) => {
        const lineAndChapter = lineAndChapters.find(
          (lc) => lc.line.lineId === attempt.lineId,
        );

        // Handle old attempts with lines that are now missing
        const lineElements: React.JSX.Element[] =
          lineAndChapter !== undefined && lineAndChapter !== null
            ? makePositionChips(
                lineAndChapter,
                chessboardState,
                handleLineSelect,
              )
            : [<div key={attempt.lineId}>{attempt.lineId}</div>];

        return {
          studyName: attempt.studyName,
          chapterName: attempt.chapterName,
          line: lineElements,
          lineAndChapter,
          attemptDate: attempt.timestamp,
          correct: attempt.correct,
        } as AttemptRow;
      })
      ?.sort((a, b) => {
        if (a.attemptDate === null) {
          return 1;
        }
        if (b.attemptDate === null) {
          return -1;
        }
        return b.attemptDate.getTime() - a.attemptDate.getTime();
      });
  }, [attempts, lineAndChapters, chessboardState, handleLineSelect]);

  const columnHelper = createColumnHelper<AttemptRow>();
  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.studyName, {
        id: "studyName",
        header: "Study",
        size: BASE_COLUMN_WIDTHS.study,
      }),
      columnHelper.accessor((row) => row.chapterName, {
        id: "chapterName",
        header: "Chapter",
        size: BASE_COLUMN_WIDTHS.chapter,
      }),
      columnHelper.accessor((row) => row.line, {
        id: "line",
        header: "Line",
        size: BASE_COLUMN_WIDTHS.line,
        cell: (props) => <ClickableLineFn value={props.getValue()} />,
      }),
      columnHelper.accessor((row) => row.attemptDate, {
        id: "attemptDate",
        header: "Date",
        size: BASE_COLUMN_WIDTHS.latestAttempt,
        cell: (info) => info.getValue()?.toLocaleString() ?? "",
      }),
      columnHelper.accessor((row) => row.correct, {
        id: "outcome",
        header: "Outcome",
        size: BASE_COLUMN_WIDTHS.estimatedSuccessRate,
        cell: (info) => (info.getValue() ? "Correct" : "Incorrect"),
      }),
    ],
    [columnHelper],
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      <div className="flex-none">
        <DetailsPanel
          chapter={reviewState.lineAndChapter?.chapter}
          currentPosition={chessboardState.getCurrentPosition() ?? undefined}
          positions={chessboardState.positions}
          engineData={engineData}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <DynamicTable columns={columns} data={attemptRows} />
      </div>
    </div>
  );
};
