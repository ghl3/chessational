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

const ClickableLineFn: React.FC<{ getValue: () => React.JSX.Element[] }> = ({
  getValue,
}) => (
  <div
    className="flex flex-wrap items-center gap-0.5"
    style={{
      maxWidth: "100%", // Ensure it fits within the column width
      overflow: "hidden", // Prevent content from spilling out
      textOverflow: "ellipsis", // Add ellipsis for overflowing content
      whiteSpace: "nowrap", // Prevent wrapping for a compact layout
      fontSize: "0.75rem", // Make text smaller (adjust as needed)
      lineHeight: "1rem", // Adjust line height to be compact
      padding: "0", // Remove extra padding
      margin: "0", // Remove extra margin
    }}
  >
    {getValue().map((element: React.JSX.Element, index: number) => (
      <React.Fragment key={index}>
        <span
          className="inline-block"
          style={{
            padding: "0", // No padding inside elements
            margin: "0", // No margin inside elements
            fontSize: "inherit", // Use the same size as parent
          }}
        >
          {element}
        </span>
      </React.Fragment>
    ))}
  </div>
);

const ClickableLineSimpleFn: React.FC<{
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

export interface BaseStudyRow {
  studyName: string;
  chapterName: string;
  line: React.JSX.Element[];
}

export interface StudyTableProps<T extends BaseStudyRow> {
  data: T[];
  extraColumns?: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
}

export const StudyTable = <T extends BaseStudyRow>({
  data,
  extraColumns = [],
  onRowClick,
}: StudyTableProps<T>) => {
  const columnHelper = createColumnHelper<T>();

  const columns = useMemo(() => {
    const BASE_COLUMN_WIDTHS = {
      study: 80,
      chapter: 80,
      line: 200,
      extra: 32,
    } as const;

    const extraColumnsWithSize = extraColumns.map((column) => ({
      ...column,
      size: BASE_COLUMN_WIDTHS.extra,
    }));

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
        cell: ClickableLineSimpleFn,
      }),
      ...extraColumnsWithSize,
    ] as ColumnDef<T>[];
  }, [columnHelper, extraColumns]);

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
