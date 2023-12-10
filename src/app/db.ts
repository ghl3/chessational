// db.ts
import { Attempt } from "@/chess/Attempt";
import { Chapter } from "@/chess/Chapter";
import { LichessDatabase } from "@/chess/DatabasePosition";
import { Fen } from "@/chess/Fen";
import { Line } from "@/chess/Line";
import { Study } from "@/chess/Study";
import Dexie, { Table } from "dexie";

export class OpeningsDb extends Dexie {
  studies!: Table<Study>;
  chapters!: Table<Chapter>;
  lines!: Table<Line>;
  selectedStudyName!: Table<{ studyName: string }>;
  selectedChapterNames!: Table<{ studyName: string; chapterName: string }>;
  positions!: Table<{ fen: Fen; database: LichessDatabase }>;
  attempts!: Table<{ lineId: string; attempt: Attempt }>;

  constructor() {
    super("OpeningsDb");
    this.version(1).stores({
      studies: "name",
      chapters: "name, studyName",
      lines: "lineId, studyName, chapterName",
      selectedStudyName: "studyName",
      selectedChapterNames: "++id, studyName, chapterName",
    });
    this.version(2).stores({
      positions: "fen",
    });
    this.version(3).stores({
      attempts: "lineId",
    });
  }
}

export const db = new OpeningsDb();
