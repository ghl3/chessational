// db.ts
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

  constructor() {
    super("OpeningsDb");
    this.version(1).stores({
      studies: "name",
      chapters: "++id, studyName, name",
      lines: "++id, studyName, chapterName",
      selectedStudyName: "studyName",
      selectedChapterNames: "++id, studyName, chapterName",
    });
    this.version(2).stores({
      positions: "fen",
    });
  }
}

export const db = new OpeningsDb();
