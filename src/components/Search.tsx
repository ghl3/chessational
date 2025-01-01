import { Attempt } from "@/chess/Attempt";
import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { getStats, LineStats } from "@/utils/LineStats";
import { ColumnDef } from "@tanstack/react-table";
import React, { useMemo, useState } from "react";
import { makePositionChips } from "./PositionChip";
import { SearchBar } from "./SearchBar";
import { BaseStudyRow, StudyTable } from "./StudyTable";

// Extend BaseStudyRow with our specific needs
interface SearchRow extends BaseStudyRow {
  lineAndChapter: LineAndChapter;
  numAttempts: number;
  numCorrect: number;
  latestAttempt: Date | null;
  estimatedSuccessRate: number | null;
}

interface SearchProps {
  lines: Line[];
  chapters: Chapter[];
  attempts: Attempt[];
  chessboardState: ChessboardState;
}

const Search: React.FC<SearchProps> = ({
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

  // Define the extra columns for stats using explicit ColumnDef type
  const extraColumns = useMemo<ColumnDef<SearchRow>[]>(
    () => [
      {
        header: "Num Attempts",
        accessorFn: (row) => row.numAttempts,
        sortingFn: "basic",
      },
      {
        header: "Num Correct",
        accessorFn: (row) => row.numCorrect,
        sortingFn: "basic",
      },
      {
        header: "Latest Attempt",
        accessorFn: (row) => row.latestAttempt,
        cell: (info) => {
          if (info.getValue<Date>() === null) {
            return "";
          } else {
            return info.getValue<Date>().toLocaleString();
          }
        },
        sortingFn: "datetime",
      },
      {
        header: "Estimated Success Rate",
        accessorFn: (row) => row.estimatedSuccessRate,
        cell: (info) => {
          if (info.getValue<number>() === null) {
            return "";
          } else {
            return info.getValue<number>().toFixed(3);
          }
        },
        sortingFn: "basic",
      },
    ],
    [],
  );

  // Transform the data for the table
  const tableData: SearchRow[] = useMemo(() => {
    const rows: SearchRow[] = [];

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

  const onRowClick = (row: SearchRow) => {
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

  return (
    <>
      <SearchBar
        lines={lineAndChapters}
        filteredLines={filteredLines}
        setFilteredLines={setFilteredLines}
      />
      <StudyTable
        data={tableData}
        extraColumns={extraColumns}
        onRowClick={onRowClick}
      />
    </>
  );
};

export default Search;
