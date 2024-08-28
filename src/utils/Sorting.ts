import { Row } from "react-table";

export const numericSortType = <T extends object>(
  rowA: Row<T>,
  rowB: Row<T>,
  columnId: string,
  desc?: boolean,
): number => {
  const valueA = rowA.values[columnId];
  const valueB = rowB.values[columnId];

  // Convert to numbers if they are not already
  const numA = typeof valueA === "number" ? valueA : parseFloat(valueA);
  const numB = typeof valueB === "number" ? valueB : parseFloat(valueB);

  // Handle NaN and undefined values
  if (isNaN(numA)) return 1;
  if (isNaN(numB)) return -1;

  // Sorting
  return numA > numB ? 1 : -1;
};

export const dateSortType = <T extends object>(
  rowA: Row<T>,
  rowB: Row<T>,
  columnId: string,
): number => {
  const valueA = rowA.values[columnId];
  const valueB = rowB.values[columnId];

  const dateA = new Date(valueA);
  const dateB = new Date(valueB);

  if (dateA > dateB) return 1;
  if (dateA < dateB) return -1;
  return 0;
};
