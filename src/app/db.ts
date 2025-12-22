// db.ts
import { Attempt } from "@/chess/Attempt";
import { Chapter } from "@/chess/Chapter";
import { LichessDatabase } from "@/chess/DatabasePosition";
import { Fen } from "@/chess/Fen";
import { Line } from "@/chess/Line";
import { Study } from "@/chess/Study";
import { ChessComGame } from "@/chess/ChessComGame";
import { GamePositionTree } from "@/chess/GamePositionTree";
import { ComparisonResult } from "@/utils/RepertoireComparer";
import Dexie, { Table } from "dexie";

/**
 * Stored config for games search caching
 */
export interface GamesSearchConfig {
  id: number; // Always 1 - we only store one config
  username: string;
  startDate: number; // Unix timestamp
  endDate: number; // Unix timestamp
  timeClasses: string[];
}

/**
 * Cached game trees and comparison results
 */
export interface CachedGameData {
  id: number; // Always 1 - we only store one set
  whiteTree: GamePositionTree;
  blackTree: GamePositionTree;
  // Cached comparison results (null if not yet compared)
  whiteComparisonResult: ComparisonResult | null;
  blackComparisonResult: ComparisonResult | null;
  // Chapter names used for comparison (to detect if re-comparison needed)
  comparedChapterNames: string[];
}

export class OpeningsDb extends Dexie {
  studies!: Table<Study>;
  chapters!: Table<Chapter>;
  lines!: Table<Line>;
  selectedStudyName!: Table<{ studyName: string }>;
  selectedChapterNames!: Table<{ studyName: string; chapterName: string }>;
  positions!: Table<{ fen: Fen; database: LichessDatabase }>;
  attempts!: Table<Attempt>;
  chesscomGames!: Table<ChessComGame>;
  gamesSearchConfig!: Table<GamesSearchConfig>;
  cachedGameData!: Table<CachedGameData>;

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
      attempts: "++id, lineId, studyName, chapterName",
    });
    this.version(4).stores({
      chesscomGames: "gameId, username, date",
    });
    this.version(5).stores({
      gamesSearchConfig: "id",
    });
    this.version(6).stores({
      cachedGameTrees: "id",
    });
    // Version 7: Rename cachedGameTrees to cachedGameData and add comparison results
    this.version(7).stores({
      cachedGameTrees: null, // Delete old table
      cachedGameData: "id",
    });
  }
}

export const db = new OpeningsDb();

/**
 * Invalidate the cached comparison results.
 * Call this when the repertoire changes (study refresh, add, delete).
 */
export const invalidateGameComparisonCache = async (): Promise<void> => {
  try {
    const cachedData = await db.cachedGameData.get(1);
    if (cachedData) {
      await db.cachedGameData.put({
        ...cachedData,
        whiteComparisonResult: null,
        blackComparisonResult: null,
        comparedChapterNames: [],
      });
      console.log("[Cache] Game comparison cache invalidated due to repertoire change");
    }
  } catch (err) {
    console.error("[Cache] Failed to invalidate game comparison cache:", err);
  }
};
