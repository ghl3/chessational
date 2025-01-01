import { Attempt } from "@/chess/Attempt";
import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { getStats, LineStats } from "@/utils/LineStats";
import React, { useMemo, useState } from "react";
import { LineRow, LineTable } from "./LineTable";
import { makePositionChips } from "./PositionChip";
import { SearchBar } from "./SearchBar";

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

  return (
    <>
      <SearchBar
        lines={lineAndChapters}
        filteredLines={filteredLines}
        setFilteredLines={setFilteredLines}
      />
      <LineTable data={tableData} onRowClick={onRowClick} />
    </>
  );
};

export default Lines;
