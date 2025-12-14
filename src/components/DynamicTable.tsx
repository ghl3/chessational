import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

export type ColumnWidths = {
  study: number;
  chapter: number;
  line: number;
  numAttempts: number;
  numCorrect: number;
  latestAttempt: number;
  estimatedSuccessRate: number;
};

export const BASE_COLUMN_WIDTHS: Readonly<ColumnWidths> = {
  study: 80,
  chapter: 80,
  line: 200,
  numAttempts: 32,
  numCorrect: 32,
  latestAttempt: 64,
  estimatedSuccessRate: 64,
} as const;

export const ClickableLineFn = ({ value }: { value: React.JSX.Element[] }) => (
  <div className="flex flex-wrap gap-0.5 items-center">
    {value.map((element, index) => (
      <span key={index}>{element}</span>
    ))}
  </div>
);

// Keep the original props interface simple
export interface DynamicTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  onRowClick?: (row: T) => void;
}

export const DynamicTable = <T,>({
  columns,
  data,
  onRowClick,
}: DynamicTableProps<T>) => {
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  return (
    <div className="h-full overflow-auto rounded-lg border border-gray-700 table-scroll">
      <table className="text-sm text-left">
        <thead className="bg-gray-900 sticky top-0 z-[5]">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-2 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors relative group whitespace-nowrap"
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ minWidth: header.getSize() }}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    <span className="text-gray-500">
                      {{
                        asc: "↑",
                        desc: "↓",
                      }[header.column.getIsSorted() as string] ?? ""}
                    </span>
                  </div>
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={`resizer absolute right-0 top-0 h-full w-1 bg-gray-600 cursor-col-resize opacity-0 group-hover:opacity-100 ${
                      header.column.getIsResizing() ? "isResizing opacity-100 bg-blue-500" : ""
                    }`}
                  />
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-gray-700/50 transition-colors cursor-pointer"
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-2 py-1.5 text-gray-300 align-top"
                  style={{ minWidth: cell.column.getSize() }}
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

export default DynamicTable;
