// db.ts
import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { Study } from "@/chess/Study";
import Dexie, { Table } from "dexie";

export class OpeningsDb extends Dexie {
  studies!: Table<Study>;
  chapters!: Table<Chapter>;
  lines!: Table<Line>;
  selectedStudyName!: Table<{ studyName: string }>;
  selectedChapterNames!: Table<{ studyName: string; chapterName: string }>;

  constructor() {
    super("OpeningsDb");
    this.version(1).stores({
      studies: "name",
      chapters: "++id, studyName, name",
      lines: "++id, studyName, chapterName",
      selectedStudyName: "studyName",
      selectedChapterNames: "++id, studyName, chapterName",
    });
  }
}

export const db = new OpeningsDb();
