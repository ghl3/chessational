import { Attempt } from "@/chess/Attempt";
import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
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
}

export const Attempts: React.FC<AttemptsProps> = ({
  lines,
  chapters,
  attempts,
  chessboardState,
}) => {
  const lineAndChapters = useMemo(() => {
    return lines?.map((line) => {
      const chapter = chapters.find(
        (chapter) => chapter.name === line.chapterName,
      );
      if (chapter == undefined) {
        throw new Error(`Chapter ${line.chapterName} not found`);
      }
      return {
        line: line,
        chapter: chapter,
      };
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
          lineAndChapter != null
            ? makePositionChips(lineAndChapter, chessboardState)
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
        if (a.attemptDate == null) {
          return 1;
        }
        if (b.attemptDate == null) {
          return -1;
        }
        return b.attemptDate.getTime() - a.attemptDate.getTime();
      });
  }, [attempts, lineAndChapters, chessboardState]);

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
    <div className="flex flex-col flex-1">
      <DynamicTable columns={columns} data={attemptRows} />
    </div>
  );
};
