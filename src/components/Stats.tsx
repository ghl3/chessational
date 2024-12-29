import { Attempt } from "@/chess/Attempt";
import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { getStats, LineStats } from "@/utils/LineStats";
import { ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import { makePositionChips } from "./PositionChip";
import { BaseStudyRow, StudyTable } from "./StudyTable";

interface StatsRow extends BaseStudyRow {
  numAttempts: number;
  numCorrect: number;
  latestAttempt: Date;
  estimatedSuccessRate: number;
}

interface StatsPageProps {
  lines: Line[];
  chapters: Chapter[];
  attempts: Attempt[];
  chessboardState: ChessboardState;
}

const StatsPage: React.FC<StatsPageProps> = ({
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

  const stats: Map<string, LineStats> = useMemo(() => {
    return getStats(attempts || []);
  }, [attempts]);

  // Define the extra columns for stats using explicit ColumnDef type
  const extraColumns = useMemo<ColumnDef<StatsRow>[]>(
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
        cell: (info) => info.getValue<Date>().toLocaleString(),
        sortingFn: "datetime",
      },
      {
        header: "Estimated Success Rate",
        accessorFn: (row) => row.estimatedSuccessRate,
        cell: (info) => info.getValue<number>().toFixed(3),
        sortingFn: "basic",
      },
    ],
    [],
  );

  // Transform data into the format StudyTable expects
  const tableData: StatsRow[] = useMemo(() => {
    const rows: StatsRow[] = [];
    for (const stat of stats.values()) {
      const lineAndChapter = lineAndChapters.find(
        (lineAndChapter) => lineAndChapter.line.lineId === stat.lineId,
      );

      if (!lineAndChapter) {
        throw new Error("Could not find line and chapter");
      }

      rows.push({
        studyName: stat.study,
        chapterName: stat.chapter,
        line: makePositionChips(lineAndChapter, chessboardState),
        numAttempts: stat.numAttempts,
        numCorrect: stat.numCorrect,
        latestAttempt: new Date(stat.latestAttempt),
        estimatedSuccessRate: stat.estimatedSuccessRate,
      });
    }
    return rows;
  }, [stats, lineAndChapters, chessboardState]);

  return <StudyTable data={tableData} extraColumns={extraColumns} />;
};

export default StatsPage;
