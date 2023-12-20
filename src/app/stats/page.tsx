"use client";

import { Line } from "@/chess/Line";
import SuperTable from "@/components/SuperTable";
import { StudyData, useStudyData } from "@/hooks/UseStudyData";
import { Attempt } from "@/utils/Attempt";
import { useMemo } from "react";

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
    attemptStat.estimatedSuccessRate =
      attemptStat.numCorrect / attemptStat.numAttempts;
  }

  return stats;
};

const StatsPage = () => {
  const studyData: StudyData = useStudyData();

  const stats = useMemo(() => {
    return getStats(studyData.attempts || []);
  }, [studyData.attempts]);

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
          },
          {
            Header: "Num Correct",
            id: "numCorrect",
            accessor: "stat.numCorrect",
          },
          /*
          {
            Header: "Num Wrong",
            id: "numWrong",
            accessor: "stat.numWrong",
          },
          */
          /*
          {
            Header: "Latest Attempt",
            id: "latestAttempt",
            accessor: "stat.latestAttempt",
            Cell: ({ value }: { value: string }) => {
              // Custom rendering logic for the 'Latest Attempt' column
              const date = new Date(value);
              return date.toLocaleDateString(); // Format the date as needed
            },
          },
          {
            Header: "Latest Success",
            id: "latestSuccess",
            accessor: "stat.latestSuccess",
            Cell: ({ value }: { value: string }) => {
              // Custom rendering logic for the 'Latest Success' column
              const date = new Date(value);
              return date.toLocaleDateString(); // Format the date as needed
            },
          },
          */
          {
            Header: "Estimated Success Rate",
            id: "estimatedSuccessRate",
            accessor: "stat.estimatedSuccessRate",
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