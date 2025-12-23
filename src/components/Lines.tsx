import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { EngineData } from "@/hooks/UseEngineData";
import { ReviewState } from "@/hooks/UseReviewState";
import { Token } from "@/utils/Tokenizer";
import { createColumnHelper } from "@tanstack/react-table";
import React, { useCallback, useMemo, useState } from "react";
import { DetailsPanel } from "./DetailsPanel";
import {
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
}

interface LinesProps {
  lines: Line[];
  chapters: Chapter[];
  chessboardState: ChessboardState;
  engineData: EngineData;
  reviewState: ReviewState;
}

const Lines: React.FC<LinesProps> = ({
  lines,
  chapters,
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
      // Match by both study name and chapter name (important for multi-study)
      const chapter = chapters.find(
        (ch) => ch.studyName === line.studyName && ch.name === line.chapterName,
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

  // Transform the data for the table
  const tableData: LineRow[] = useMemo(() => {
    const rows: LineRow[] = [];

    for (const lineAndChapter of filteredLines) {
      rows.push({
        lineAndChapter: lineAndChapter,
        studyName: lineAndChapter.line.studyName,
        chapterName: lineAndChapter.line.chapterName,
        line: makePositionChips(lineAndChapter, chessboardState, handleLineSelect),
      });
    }

    return rows;
  }, [filteredLines, chessboardState, handleLineSelect]);

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
        size: 120,
      }),
      columnHelper.accessor((row) => row.chapterName, {
        id: "chapterName",
        header: "Chapter",
        size: 120,
      }),
      columnHelper.accessor((row) => row.line, {
        id: "line",
        header: "Line",
        size: 500,
        cell: (props) => <ClickableLineFn value={props.getValue()} />,
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
      <div className="flex-1 min-h-0 h-full">
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
