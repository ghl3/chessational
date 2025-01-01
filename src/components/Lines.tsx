import { Attempt } from "@/chess/Attempt";
import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { getStats, LineStats } from "@/utils/LineStats";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import React, { useMemo, useState } from "react";
import {
  BASE_COLUMN_WIDTHS,
  ClickableLineFn,
  DynamicTable,
} from "./DynamicTable";
import { makePositionChips } from "./PositionChip";
import { SearchBar } from "./SearchBar";

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
}

const Lines: React.FC<LinesProps> = ({
  lines,
  chapters,
  attempts,
  chessboardState,
}) => {
  const lineAndChapters = useMemo(() => {
    return lines.map((line) => {
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

  const [filteredLines, setFilteredLines] =
    useState<LineAndChapter[]>(lineAndChapters);

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
        line: makePositionChips(lineAndChapter, chessboardState),
        numAttempts: stat?.numAttempts || 0,
        numCorrect: stat?.numCorrect || 0,
        latestAttempt: stat?.latestAttempt || null,
        estimatedSuccessRate: stat?.estimatedSuccessRate || null,
      });
    }

    return rows;
  }, [filteredLines, chessboardState, stats]);

  const onRowClick = (row: LineRow) => {
    chessboardState.setOrientation(row.lineAndChapter.chapter.orientation);
    chessboardState.clearAndSetPositions(row.lineAndChapter.line.positions, 0);
  };

  if (lines.length === 0) {
    return (
      <div className="text-gray-800 dark:text-gray-200">
        Select a chapter first
      </div>
    );
  }

  const columnHelper = createColumnHelper<LineRow>();
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
      columnHelper.accessor((row) => row.numAttempts, {
        id: "numAttempts",
        header: "Num Attempts",
        size: BASE_COLUMN_WIDTHS.numAttempts,
      }),
      columnHelper.accessor((row) => row.numCorrect, {
        id: "numCorrect",
        header: "Num Correct",
        size: BASE_COLUMN_WIDTHS.numCorrect,
      }),
      columnHelper.accessor((row) => row.latestAttempt, {
        id: "latestAttempt",
        header: "Latest Attempt",
        size: BASE_COLUMN_WIDTHS.latestAttempt,
        cell: (info) => info.getValue()?.toLocaleString() ?? "",
      }),
      columnHelper.accessor((row) => row.estimatedSuccessRate, {
        id: "estimatedSuccessRate",
        header: "Estimated Success Rate",
        size: BASE_COLUMN_WIDTHS.estimatedSuccessRate,
        cell: (info) => info.getValue()?.toFixed(3) ?? "",
      }),
    ],
    [],
  );

  return (
    <>
      <SearchBar
        lines={lineAndChapters}
        filteredLines={filteredLines}
        setFilteredLines={setFilteredLines}
      />
      <DynamicTable
        columns={columns}
        data={tableData}
        onRowClick={onRowClick}
      />
    </>
  );
};

export default Lines;
