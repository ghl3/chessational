import React from "react";
import { Column, Row, useSortBy, useTable } from "react-table";

type SuperTableProps<T extends object> = {
  columns: Column<T>[];
  data: T[];
};

const SuperTable = <T extends object>({
  columns,
  data,
}: SuperTableProps<T>) => {
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
      },
      useSortBy,
    );

  return (
    <table {...getTableProps()} className="min-w-full divide-y divide-gray-700">
      <thead className="bg-gray-800">
        {headerGroups.map((headerGroup: any, headerIdx: number) => (
          <tr
            {...headerGroup.getHeaderGroupProps()}
            key={`header-tr-${headerIdx}`}
          >
            {headerGroup.headers.map((column: any, idx: number) => (
              <th
                {...column.getHeaderProps(column.getSortByToggleProps())}
                key={`header-th-${headerIdx}-${idx}`}
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
              >
                {column.render("Header")}
                <span key={`header-span-${headerIdx}-${idx}`}>
                  {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
                </span>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody
        {...getTableBodyProps()}
        className="bg-gray-900 divide-y divide-gray-700"
      >
        {rows.map((row: Row<T>, trIdx: number) => {
          prepareRow(row);
          return (
            <tr
              {...row.getRowProps()}
              key={`row-tr-${trIdx}`}
              className="hover:bg-gray-700"
            >
              {row.cells.map((cell: any, tdIdx: number) => (
                <td
                  {...cell.getCellProps()}
                  key={`row-td-${trIdx}-${tdIdx}`}
                  className="px-6 py-4 whitespace-nowrap text-gray-300"
                >
                  {cell.render("Cell")}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default SuperTable;
