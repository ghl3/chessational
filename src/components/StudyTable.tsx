import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import React, { useMemo } from "react";
import SuperTable from "./SuperTable";

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

    const minWidth = calculateMinWidth();
    return { columns: baseColumns, minWidth };
  }, [columnHelper, extraColumns]);

  return (
    <div style={{ width: `${columns.minWidth}px` }}>
      <SuperTable
        columns={columns.columns}
        data={data}
        onRowClick={onRowClick}
      />
    </div>
  );
};
