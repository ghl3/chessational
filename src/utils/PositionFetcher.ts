import { LichessDatabase } from "@/chess/DatabasePosition";
import { Fen } from "@/chess/Fen";
import { Table } from "dexie";

class LichessError extends Error {
  statusText: string;

  constructor(message: string, statusText: string) {
    super(message);
    this.statusText = statusText;
  }
}

export const fetchDatabaseForFen = async (
  fen: string,
): Promise<LichessDatabase> => {
  const response = await fetch(
    `https://explorer.lichess.ovh/lichess?fen=${encodeURIComponent(fen)}`,
  );
  if (!response.ok) {
    throw new LichessError(
      `Failed to fetch database for fen ${fen}`,
      response.statusText,
    );
  }

  const data = await response.json();
  return data;
};

export const getOrFetchAndCacheDatabase = async (
  fen: string,
  positionTable: Table<{ fen: Fen; database: LichessDatabase }>,
): Promise<LichessDatabase> => {
  const existingPosition = await positionTable.get({ fen: fen });
  if (existingPosition != undefined) {
    console.log("Using cached database for fen", fen);
    return existingPosition.database;
  }

  const database = await fetchDatabaseForFen(fen);
  await positionTable.put({ fen: fen, database: database });
  return database;
};
