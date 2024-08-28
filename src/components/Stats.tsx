"use client";

import { Attempt } from "@/chess/Attempt";
import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import SuperTable from "@/components/SuperTable";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { getStats, LineStats } from "@/utils/LineStats";
import { dateSortType, numericSortType } from "@/utils/Sorting";
import { useMemo } from "react";
import { Row } from "react-table";
import { makePositionChips } from "./PositionChip";

interface StatsPageProps {
  //lineAndChapters: LineAndChapter[];
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

  const columns = useMemo(
    () => [
      {
        Header: "Lines",
        columns: [
          {
            Header: "Study",
            id: "study",
            accessor: "stat.study",
          },
          {
            Header: "Chater",
            id: "chapter",
            accessor: "stat.chapter",
          },
          {
            Header: "Line",
            id: "line",
            accessor: "line",
            minWidth: 600,
          },
          {
            Header: "Num Attempts",
            id: "numAttempts",
            accessor: "stat.numAttempts",
            sortType: numericSortType,
          },
          {
            Header: "Num Correct",
            id: "numCorrect",
            accessor: "stat.numCorrect",
            sortType: numericSortType,
          },
          {
            Header: "Latest Attempt",
            id: "latestAttempt",
            accessor: "stat.latestAttempt",
            sortType: dateSortType,
            Cell: ({ value }: { value: string }) => {
              return new Date(value).toLocaleString();
            },
          },
          {
            Header: "Estimated Success Rate",
            id: "estimatedSuccessRate",
            accessor: "stat.estimatedSuccessRate",
            sortType: numericSortType,
            Cell: ({ value }: { value: any }) => value.toFixed(3),
          },
        ],
      },
    ],
    [],
  );

  const data = useMemo(() => {
    const rows = [];
    for (const stat of stats.values()) {
      const lineAndChapter = lineAndChapters.find(
        (lineAndChapter) => lineAndChapter.line.lineId === stat.lineId,
      );

      if (!lineAndChapter) {
        throw new Error("Could not find line and chapter");
      }

      rows.push({
        stat: stat,
        line: makePositionChips(lineAndChapter, chessboardState),
      });
    }
    return rows;
  }, [stats, lineAndChapters]);

  return (
    <div>
      <SuperTable columns={columns} data={data} />
    </div>
  );
};

export default StatsPage;
