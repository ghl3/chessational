import { Attempt } from "@/chess/Attempt";
import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { EngineData } from "@/hooks/UseEngineData";
import { ReviewState } from "@/hooks/UseReviewState";
import { getStats, LineStats as LineStatsType } from "@/utils/LineStats";
import { createColumnHelper } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DetailsPanel } from "./DetailsPanel";
import DynamicTable, {
  BASE_COLUMN_WIDTHS,
  ClickableLineFn,
} from "./DynamicTable";
import { makePositionChips } from "./PositionChip";
import Selector, { SelectOption } from "./Selector";

// Line stats row (aggregated)
export interface LineStatsRow {
  studyName: string;
  chapterName: string;
  line: React.JSX.Element[];
  lineAndChapter: LineAndChapter;
  numAttempts: number;
  numCorrect: number;
  latestAttempt: Date | null;
  estimatedSuccessRate: number | null;
}

interface LineStatsProps {
  lines: Line[];
  chapters: Chapter[];
  attempts: Attempt[];
  chessboardState: ChessboardState;
  engineData: EngineData;
  reviewState: ReviewState;
}

export const LineStats: React.FC<LineStatsProps> = ({
  lines,
  chapters,
  attempts,
  chessboardState,
  engineData,
  reviewState,
}) => {
  // Filters
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);

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
      // Match by both study name and chapter name (important for multi-study)
      const chapter = chapters.find(
        (ch) => ch.studyName === line.studyName && ch.name === line.chapterName,
      );
      if (chapter === undefined) {
        return [];
      }
      return [{ line, chapter }];
    });
  }, [lines, chapters]);

  // Get unique studies and chapters for filters
  const studyOptions: SelectOption[] = useMemo(() => {
    const studies = [...new Set(lineAndChapters.map((lc) => lc.line.studyName))];
    return studies.map((s) => ({ value: s, label: s }));
  }, [lineAndChapters]);

  const chapterOptions: SelectOption[] = useMemo(() => {
    // Filter chapters based on selected studies
    const filtered = selectedStudies.length > 0
      ? lineAndChapters.filter((lc) => selectedStudies.includes(lc.line.studyName))
      : lineAndChapters;
    
    const chapterKeys = [...new Set(filtered.map((lc) => `${lc.line.studyName}|${lc.line.chapterName}`))];
    return chapterKeys.map((c) => {
      const [studyName, chapterName] = c.split("|");
      return { 
        value: c, 
        label: chapterName,
        group: studyName,
      };
    });
  }, [lineAndChapters, selectedStudies]);

  // Filter attempts based on selected studies and chapters
  const filteredAttempts = useMemo(() => {
    return attempts.filter((attempt) => {
      if (selectedStudies.length > 0 && !selectedStudies.includes(attempt.studyName)) {
        return false;
      }
      if (selectedChapters.length > 0) {
        const key = `${attempt.studyName}|${attempt.chapterName}`;
        if (!selectedChapters.includes(key)) {
          return false;
        }
      }
      return true;
    });
  }, [attempts, selectedStudies, selectedChapters]);

  // Calculate line stats
  const lineStats: Map<string, LineStatsType> = useMemo(() => {
    return getStats(filteredAttempts);
  }, [filteredAttempts]);

  // Build line stats rows
  const statsRows: LineStatsRow[] = useMemo(() => {
    // Filter line and chapters based on selected filters
    const filtered = lineAndChapters.filter((lc) => {
      if (selectedStudies.length > 0 && !selectedStudies.includes(lc.line.studyName)) {
        return false;
      }
      if (selectedChapters.length > 0) {
        const key = `${lc.line.studyName}|${lc.line.chapterName}`;
        if (!selectedChapters.includes(key)) {
          return false;
        }
      }
      return true;
    });

    return filtered.map((lc) => {
      const stats = lineStats.get(lc.line.lineId);
      return {
        studyName: lc.line.studyName,
        chapterName: lc.line.chapterName,
        line: makePositionChips(lc, chessboardState, handleLineSelect),
        lineAndChapter: lc,
        numAttempts: stats?.numAttempts ?? 0,
        numCorrect: stats?.numCorrect ?? 0,
        latestAttempt: stats?.latestAttempt ?? null,
        estimatedSuccessRate: stats?.estimatedSuccessRate ?? null,
      };
    }).sort((a, b) => {
      // Sort by success rate (ascending - worst first), then by attempts (most first)
      if (a.estimatedSuccessRate === null && b.estimatedSuccessRate === null) {
        return b.numAttempts - a.numAttempts;
      }
      if (a.estimatedSuccessRate === null) return -1; // Never attempted first
      if (b.estimatedSuccessRate === null) return 1;
      return a.estimatedSuccessRate - b.estimatedSuccessRate;
    });
  }, [lineAndChapters, lineStats, selectedStudies, selectedChapters, chessboardState, handleLineSelect]);

  // Column definitions for stats view
  const statsColumnHelper = createColumnHelper<LineStatsRow>();
  const statsColumns = useMemo(
    () => [
      statsColumnHelper.accessor((row) => row.studyName, {
        id: "studyName",
        header: "Study",
        size: BASE_COLUMN_WIDTHS.study,
      }),
      statsColumnHelper.accessor((row) => row.chapterName, {
        id: "chapterName",
        header: "Chapter",
        size: BASE_COLUMN_WIDTHS.chapter,
      }),
      statsColumnHelper.accessor((row) => row.line, {
        id: "line",
        header: "Line",
        size: BASE_COLUMN_WIDTHS.line,
        cell: (props) => <ClickableLineFn value={props.getValue()} />,
      }),
      statsColumnHelper.accessor((row) => row.numAttempts, {
        id: "numAttempts",
        header: "Attempts",
        size: 70,
      }),
      statsColumnHelper.accessor((row) => row.numCorrect, {
        id: "numCorrect",
        header: "Correct",
        size: 70,
      }),
      statsColumnHelper.accessor((row) => row.estimatedSuccessRate, {
        id: "successRate",
        header: "Success",
        size: 70,
        cell: (info) => {
          const val = info.getValue();
          if (val === null) return <span className="text-gray-500">-</span>;
          const pct = Math.round(val * 100);
          const color = pct >= 80 ? "text-green-400" : pct >= 50 ? "text-yellow-400" : "text-red-400";
          return <span className={color}>{pct}%</span>;
        },
      }),
      statsColumnHelper.accessor((row) => row.latestAttempt, {
        id: "latestAttempt",
        header: "Last",
        size: 90,
        cell: (info) => info.getValue()?.toLocaleDateString() ?? <span className="text-gray-500">Never</span>,
      }),
    ],
    [statsColumnHelper],
  );

  const onRowClick = useCallback(
    (row: LineStatsRow) => {
      chessboardState.setOrientation(row.lineAndChapter.chapter.orientation);
      chessboardState.clearAndSetPositions(row.lineAndChapter.line.positions, 0);
      handleLineSelect(row.lineAndChapter);
    },
    [chessboardState, handleLineSelect],
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

      {/* Filters */}
      <div className="flex-none flex flex-wrap gap-2 items-center">
        {/* Study Filter */}
        <Selector
          options={studyOptions}
          selectedValues={selectedStudies}
          onChange={setSelectedStudies}
          placeholder="All studies"
          multiSelect={true}
          className="w-40"
          formatMultipleDisplay={(selected) =>
            selected.length === 0
              ? "All studies"
              : selected.length === 1
              ? selected[0].label
              : `${selected.length} studies`
          }
        />

        {/* Chapter Filter */}
        <Selector
          options={chapterOptions}
          selectedValues={selectedChapters}
          onChange={setSelectedChapters}
          placeholder="All chapters"
          multiSelect={true}
          showGroupHeaders={true}
          className="w-44"
          formatMultipleDisplay={(selected) =>
            selected.length === 0
              ? "All chapters"
              : selected.length === 1
              ? selected[0].label
              : `${selected.length} chapters`
          }
        />

        {/* Result count */}
        <span className="text-sm text-gray-400 ml-auto">
          {statsRows.length} lines
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 h-full">
        <DynamicTable 
          columns={statsColumns} 
          data={statsRows} 
          onRowClick={onRowClick}
        />
      </div>
    </div>
  );
};

