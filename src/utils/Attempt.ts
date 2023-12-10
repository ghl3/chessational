import { Fen } from "@/chess/Fen";
import { Line } from "@/chess/Line";
import { Table } from "dexie";

export interface Attempt {
  studyId: string;
  chapterId: string;
  lineId: string;
  correct: boolean;
  failedOnPosition?: Fen;
  timestamp: Date;
}

export const storeAttemptResult = async (
  line: Line,
  isCorrect: boolean,
  table: Table<{ lineId: string; attempt: Attempt }>,
) => {
  const attempt: Attempt = {
    studyId: line.studyName,
    chapterId: line.chapterName,
    lineId: line.lineId,
    correct: isCorrect,
    timestamp: new Date(),
  };

  await table.add({ lineId: line.lineId, attempt: attempt });
};
