"use client";

import { db } from "@/app/db";
import { Attempt } from "@/chess/Attempt";
import { StudyChapterSelector } from "@/components/StudyChapterSelector";
import SuperTable from "@/components/SuperTable";
import { StudyData, useStudyData } from "@/hooks/UseStudyData";
import { getStats } from "@/utils/LineStats";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { Row } from "react-table";

const numericSortType = <T extends object>(
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

const dateSortType = <T extends object>(
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

const StatsPage = () => {
  const studyData: StudyData = useStudyData();

  const attempts: Attempt[] | undefined = useLiveQuery(async () => {
    return await db.attempts.toArray();
  }, []);

  const stats = useMemo(() => {
    const studyChapterSet = new Set<string>();
    for (const selectedChapter of studyData.selectedChapterNames || []) {
      studyChapterSet.add(selectedChapter);
    }

    const selectedAttempts = attempts?.filter((attempt) => {
      return (
        attempt.studyName === studyData.selectedStudyName &&
        studyChapterSet.has(attempt.chapterName)
      );
    });

    return getStats(selectedAttempts || []);
  }, [attempts, studyData.selectedStudyName, studyData.selectedChapterNames]);

  const columns = useMemo(
    () => [
      {
        // first group - TV Show
        Header: "Lines",
        // First group columns
        columns: [
          {
            Header: "Study",
            id: "study",
            accessor: "stat.study",
          },
          {
            Header: "Chater",
            id: "chapter",
            accessor: "stat.chapter",
          },
          {
            Header: "Line",
            id: "lineId",
            accessor: "stat.lineId",
          },
          {
            Header: "Num Attempts",
            id: "numAttempts",
            accessor: "stat.numAttempts",
            sortType: numericSortType,
          },
          {
            Header: "Num Correct",
            id: "numCorrect",
            accessor: "stat.numCorrect",
            sortType: numericSortType,
          },

          {
            Header: "Latest Attempt",
            id: "latestAttempt",
            accessor: "stat.latestAttempt",
            sortType: dateSortType,
            Cell: ({ value }: { value: string }) => {
              // Custom rendering logic for the 'Latest Attempt' column
              const date = new Date(value);
              // Format the date as a date/time
              return date.toLocaleString();
            },
          },

          {
            Header: "Estimated Success Rate",
            id: "estimatedSuccessRate",
            accessor: "stat.estimatedSuccessRate",
            sortType: numericSortType,
            Cell: ({ value }: { value: any }) => value.toFixed(3),
          },
        ],
      },
    ],
    [],
  );

  const data = useMemo(() => {
    const rows = [];
    for (const stat of stats.values()) {
      rows.push({ stat });
    }
    return rows;
  }, [stats]);

  return (
    <div>
      <SuperTable columns={columns} data={data} />
    </div>
  );
};

export default StatsPage;
