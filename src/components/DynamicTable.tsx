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
  <div className="flex flex-wrap gap-1 justify-start p-1">
    {value.map((element, index) => (
      <span key={index} className="flex-shrink-0">
        {element}
      </span>
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
    <div className="w-full h-full overflow-hidden flex flex-col bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      <div className="flex-1 overflow-auto">
        <table className="w-full divide-y divide-gray-700 text-sm text-left table-fixed">
          <thead className="bg-gray-900 sticky top-0 z-[5]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors relative group"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() }}
                  >
                    <div className="flex items-center gap-1 truncate">
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
                      className={`resizer absolute right-0 top-0 h-full w-1 bg-gray-700 cursor-col-resize opacity-0 group-hover:opacity-100 ${
                        header.column.getIsResizing() ? "isResizing opacity-100 bg-blue-500" : ""
                      }`}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-2 text-gray-300 align-top overflow-hidden"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DynamicTable;
