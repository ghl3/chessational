"use client";

import { db } from "@/app/db";
import SuperTable from "@/components/SuperTable";
import { StudyData, useStudyData } from "@/hooks/UseStudyData";
import { Attempt } from "@/utils/Attempt";
import { calculateProbability } from "@/utils/LinePicker";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { Row } from "react-table";

type AttemptStat = {
  study: string;
  chapter: string;
  lineId: string;
  numAttempts: number;
  numCorrect: number;
  numWrong: number;
  latestAttempt: Date;
  latestSuccess: Date;
  estimatedSuccessRate: number;
};

const getStats = (attempts: Attempt[]) => {
  console.log("Starting getStats");
  const stats = new Map<string, AttemptStat>();

  for (const attempt of attempts) {
    const lineId = attempt.lineId;
    if (!stats.has(lineId)) {
      stats.set(lineId, {
        study: attempt.studyName,
        chapter: attempt.chapterName,
        lineId,
        numAttempts: 0,
        numCorrect: 0,
        numWrong: 0,
        latestAttempt: new Date(0),
        latestSuccess: new Date(0),
        estimatedSuccessRate: 0,
      });
    }
    const attemptStat = stats.get(lineId);
    if (!attemptStat) {
      throw new Error("Unexpected missing attemptStat");
    }
    attemptStat.numAttempts++;
    if (attempt.correct) {
      attemptStat.numCorrect++;
      attemptStat.latestSuccess = attempt.timestamp;
    } else {
      attemptStat.numWrong++;
    }
    attemptStat.latestAttempt =
      attempt.timestamp > attemptStat.latestAttempt
        ? attempt.timestamp
        : attemptStat.latestAttempt;
    attemptStat.estimatedSuccessRate = calculateProbability(
      attempt.lineId,
      attempts,
      0.5,
    );
  }

  console.log("Finished getStats");

  return stats;
};

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
    return getStats(attempts || []);
  }, [attempts]);

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
