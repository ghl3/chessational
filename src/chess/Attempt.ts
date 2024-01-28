import { Fen } from "@/chess/Fen";
import { Line } from "@/chess/Line";
import { Table } from "dexie";

export interface Attempt {
  studyName: string;
  chapterName: string;
  lineId: string;
  correct: boolean;
  failedOnPosition?: Fen;
  timestamp: Date;
}

export const storeAttemptResult = async (
  line: Line,
  isCorrect: boolean,
  table: Table<Attempt>,
) => {
  const attempt: Attempt = {
    studyName: line.studyName,
    chapterName: line.chapterName,
    lineId: line.lineId,
    correct: isCorrect,
    timestamp: new Date(),
  };

  await table.add(attempt);
};
