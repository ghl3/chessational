import { Attempt } from "@/chess/Attempt";
import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { EngineData } from "@/hooks/UseEngineData";
import { ReviewState } from "@/hooks/UseReviewState";
import { getStats, LineStats } from "@/utils/LineStats";
import { Token } from "@/utils/Tokenizer";
import { createColumnHelper } from "@tanstack/react-table";
import React, { useCallback, useMemo, useState } from "react";
import { DetailsPanel } from "./DetailsPanel";
import {
  BASE_COLUMN_WIDTHS,
  ClickableLineFn,
  DynamicTable,
} from "./DynamicTable";
import { makePositionChips } from "./PositionChip";
import { matchesQuery, SearchBar } from "./SearchBar";

export interface LineRow {
  studyName: string;
  chapterName: string;
  line: React.JSX.Element[];
  lineAndChapter: LineAndChapter;
  numAttempts: number;
  numCorrect: number;
  latestAttempt: Date | null;
  estimatedSuccessRate: number | null;
}

interface LinesProps {
  lines: Line[];
  chapters: Chapter[];
  attempts: Attempt[];
  chessboardState: ChessboardState;
  engineData: EngineData;
  reviewState: ReviewState;
}

const Lines: React.FC<LinesProps> = ({
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

  const [searchTokens, setSearchTokens] = useState<Token[]>([]);

  const filteredLines: LineAndChapter[] = useMemo(() => {
    return lineAndChapters.filter((lineAndChapter) =>
      matchesQuery(lineAndChapter.line, searchTokens),
    );
  }, [lineAndChapters, searchTokens]);

  const stats: Map<string, LineStats> = useMemo(() => {
    return getStats(attempts || []);
  }, [attempts]);

  // Transform the data for the table
  const tableData: LineRow[] = useMemo(() => {
    const rows: LineRow[] = [];

    for (const lineAndChapter of filteredLines) {
      const stat: LineStats | null =
        stats.get(lineAndChapter.line.lineId) || null;

      rows.push({
        lineAndChapter: lineAndChapter,
        studyName: lineAndChapter.line.studyName,
        chapterName: lineAndChapter.line.chapterName,
        line: makePositionChips(lineAndChapter, chessboardState, handleLineSelect),
        numAttempts: stat?.numAttempts || 0,
        numCorrect: stat?.numCorrect || 0,
        latestAttempt: stat?.latestAttempt || null,
        estimatedSuccessRate: stat?.estimatedSuccessRate || null,
      });
    }

    return rows;
  }, [filteredLines, chessboardState, stats, handleLineSelect]);

  const onRowClick = useCallback(
    (row: LineRow) => {
      chessboardState.setOrientation(row.lineAndChapter.chapter.orientation);
      chessboardState.clearAndSetPositions(row.lineAndChapter.line.positions, 0);
      handleLineSelect(row.lineAndChapter);
    },
    [chessboardState, handleLineSelect],
  );

  const columnHelper = createColumnHelper<LineRow>();
  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.studyName, {
        id: "studyName",
        header: "Study",
        size: 100, // Reduced width
      }),
      columnHelper.accessor((row) => row.chapterName, {
        id: "chapterName",
        header: "Chapter",
        size: 100, // Reduced width
      }),
      columnHelper.accessor((row) => row.line, {
        id: "line",
        header: "Line",
        // Increase line width to give more space for moves
        size: 400,
        cell: (props) => <ClickableLineFn value={props.getValue()} />,
      }),
      columnHelper.accessor((row) => row.numAttempts, {
        id: "numAttempts",
        header: "Attempts",
        size: 70,
      }),
      columnHelper.accessor((row) => row.numCorrect, {
        id: "numCorrect",
        header: "Correct",
        size: 70,
      }),
      columnHelper.accessor((row) => row.latestAttempt, {
        id: "latestAttempt",
        header: "Last Attempt",
        size: 100,
        cell: (info) => info.getValue()?.toLocaleDateString() ?? "-",
      }),
      columnHelper.accessor((row) => row.estimatedSuccessRate, {
        id: "estimatedSuccessRate",
        header: "Success Rate",
        size: 90,
        cell: (info) => {
          const val = info.getValue();
          return val !== null ? `${(val * 100).toFixed(0)}%` : "-";
        },
      }),
    ],
    [columnHelper],
  );

  if (lines.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-gray-400 italic">
        Select a chapter to view lines
      </div>
    );
  }

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
      <div className="flex-none">
        <SearchBar
          filteredLines={lineAndChapters}
          tokens={searchTokens}
          setTokens={setSearchTokens}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <DynamicTable
          columns={columns}
          data={tableData}
          onRowClick={onRowClick}
        />
      </div>
    </div>
  );
};

export default Lines;
