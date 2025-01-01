import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo } from "react";

type ColumnWidths = {
  study: number;
  chapter: number;
  line: number;
  numAttempts: number;
  numCorrect: number;
  latestAttempt: number;
  estimatedSuccessRate: number;
};

const BASE_COLUMN_WIDTHS: Readonly<ColumnWidths> = {
  study: 80,
  chapter: 80,
  line: 200,
  numAttempts: 32,
  numCorrect: 32,
  latestAttempt: 64,
  estimatedSuccessRate: 64,
} as const;

const ClickableLineFn = ({ value }: { value: React.JSX.Element[] }) => (
  <div className="text-left p-0.5">
    {value.map((element, index) => (
      <span key={index} className="m-0">
        {element}
      </span>
    ))}
  </div>
);

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

export interface LineTableProps<T extends LineRow> {
  data: T[];
  onRowClick?: (row: T) => void;
}

export const LineTable = <T extends LineRow>({
  data,
  onRowClick,
}: LineTableProps<T>) => {
  const columnHelper = createColumnHelper<T>();

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
    [columnHelper],
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  return (
    <div
      className="w-full overflow-auto"
      style={{
        height: "calc(70vh)", // or whatever percentage you want
        minHeight: "400px", // minimum height in pixels
      }}
    >
      <table className="w-full divide-y divide-gray-700 text-sm">
        <thead className="bg-gray-800 sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-1 py-1 text-center text-xs font-medium text-gray-300 uppercase tracking-wide cursor-pointer"
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ width: header.column.columnDef.size }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={`resizer ${
                      header.column.getIsResizing() ? "isResizing" : ""
                    }`}
                  />
                  <span className="ml-1 text-xs">
                    {{
                      asc: "↑",
                      desc: "↓",
                    }[header.column.getIsSorted() as string] ?? ""}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-700">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-gray-700 cursor-pointer"
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-2 py-2 whitespace-normal break-words text-gray-300 text-center"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
