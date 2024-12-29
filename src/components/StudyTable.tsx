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
      study: 150,
      chapter: 150,
      line: 500,
      extra: 120,
    } as const;

    const createBaseColumns = () => [
      columnHelper.group({
        header: "Lines",
        columns: [
          columnHelper.accessor((row) => row.studyName, {
            header: "Study",
            size: BASE_COLUMN_WIDTHS.study,
          }),
          columnHelper.accessor((row) => row.chapterName, {
            header: "Chapter",
            size: BASE_COLUMN_WIDTHS.chapter,
          }),
          columnHelper.accessor((row) => row.line, {
            id: "line",
            header: "Line",
            size: BASE_COLUMN_WIDTHS.line,
            cell: ({ getValue }) => (
              <div className="flex flex-wrap gap-1">
                {getValue().map((element: React.JSX.Element, index: number) => (
                  <React.Fragment key={index}>{element}</React.Fragment>
                ))}
              </div>
            ),
          }),
        ],
      }),
    ];

    const baseColumns = createBaseColumns();
    const mainColumns = baseColumns[0].columns;

    if (extraColumns.length > 0 && mainColumns) {
      const sizedExtraColumns = extraColumns.map((col) => ({
        ...col,
        size: col.size || BASE_COLUMN_WIDTHS.extra,
      }));
      mainColumns.push(...sizedExtraColumns);
    }

    const calculateMinWidth = () => {
      const { study, chapter, line, extra } = BASE_COLUMN_WIDTHS;
      const baseWidth = study + chapter + line;
      const extraWidth = extraColumns.length * extra;
      return baseWidth + extraWidth;
    };

    return { columns: baseColumns, minWidth: calculateMinWidth() };
  }, [columnHelper, extraColumns]);

  const table = useReactTable({
    columns: columns.columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  return (
    <div style={{ width: `${columns.minWidth}px` }}>
      <div className="min-w-0 inline-block">
        <table className="divide-y divide-gray-700">
          <thead className="bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
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
                    <span>
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
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
                    className="px-6 py-4 whitespace-normal break-words text-gray-300"
                    style={{ width: cell.column.columnDef.size }}
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
