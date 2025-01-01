import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo } from "react";

const ClickableLineFn: React.FC<{
  getValue: () => React.JSX.Element[];
}> = ({ getValue }) => (
  <div className="text-left p-0.5">
    {getValue().map((element, index) => (
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

  const columns = useMemo(() => {
    const BASE_COLUMN_WIDTHS = {
      study: 80,
      chapter: 80,
      line: 200,
      numAttempts: 32,
      numCorrect: 32,
      latestAttempt: 64,
      estimatedSuccessRate: 64,
    } as const;

    return [
      columnHelper.accessor((row: T) => row.studyName, {
        id: "studyName",
        header: "Study",
        size: BASE_COLUMN_WIDTHS.study,
      }),
      columnHelper.accessor((row: T) => row.chapterName, {
        id: "chapterName",
        header: "Chapter",
        size: BASE_COLUMN_WIDTHS.chapter,
      }),
      columnHelper.accessor((row: T) => row.line, {
        id: "line",
        header: "Line",
        size: BASE_COLUMN_WIDTHS.line,
        cell: ClickableLineFn,
      }),
      {
        header: "Num Attempts",
        accessorFn: (row) => row.numAttempts,
        sortingFn: "basic",
        size: BASE_COLUMN_WIDTHS.numAttempts,
      },
      {
        header: "Num Correct",
        accessorFn: (row) => row.numCorrect,
        sortingFn: "basic",
        size: BASE_COLUMN_WIDTHS.numCorrect,
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
        size: BASE_COLUMN_WIDTHS.latestAttempt,
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
        size: BASE_COLUMN_WIDTHS.estimatedSuccessRate,
      },
    ] as ColumnDef<T>[];
  }, [columnHelper]);

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  table.getHeaderGroups().map((headerGroup) => {
    console.log(headerGroup.id);
    headerGroup.headers.map((header) => {
      console.log(header.column.columnDef);
    });
  });

  return (
    <div className="w-full overflow-hidden flex-shrink-0">
      <table className="divide-y divide-gray-700 text-sm">
        <thead className="bg-gray-800">
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
              onClick={() => onRowClick && onRowClick(row.original)}
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
