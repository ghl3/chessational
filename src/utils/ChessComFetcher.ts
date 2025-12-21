import { ChessComGame, GameResultString } from "@/chess/ChessComGame";
import { db } from "@/app/db";
import { BLACK, WHITE, Color } from "chess.js";

// Chess.com API response types
interface ChessComGameResponse {
  url: string;
  pgn: string;
  time_control: string;
  time_class: string;
  end_time: number;
  rated: boolean;
  accuracies?: {
    white: number;
    black: number;
  };
  white: {
    username: string;
    rating: number;
    result: string;
  };
  black: {
    username: string;
    rating: number;
    result: string;
  };
}

interface ChessComArchivesResponse {
  archives: string[];
}

interface ChessComGamesResponse {
  games: ChessComGameResponse[];
}

/**
 * Extract the game ID from a Chess.com game URL
 */
const extractGameId = (url: string): string => {
  // URL format: https://www.chess.com/game/live/123456789
  const parts = url.split("/");
  return parts[parts.length - 1];
};

/**
 * Determine the game result from the perspective of the given user
 */
const getResultForUser = (
  game: ChessComGameResponse,
  username: string
): GameResultString => {
  const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
  const playerResult = isWhite ? game.white.result : game.black.result;

  // Chess.com result values: win, checkmated, resigned, timeout, stalemate, etc.
  if (playerResult === "win") {
    return "win";
  } else if (
    playerResult === "checkmated" ||
    playerResult === "resigned" ||
    playerResult === "timeout" ||
    playerResult === "abandoned"
  ) {
    return "loss";
  } else {
    // stalemate, insufficient, 50move, repetition, agreed, etc.
    return "draw";
  }
};

/**
 * Get the color the user played
 */
const getColorForUser = (
  game: ChessComGameResponse,
  username: string
): Color => {
  return game.white.username.toLowerCase() === username.toLowerCase()
    ? WHITE
    : BLACK;
};

/**
 * Get the opponent's username
 */
const getOpponentUsername = (
  game: ChessComGameResponse,
  username: string
): string => {
  return game.white.username.toLowerCase() === username.toLowerCase()
    ? game.black.username
    : game.white.username;
};

/**
 * Convert a Chess.com API game response to our internal format
 */
const convertToChessComGame = (
  game: ChessComGameResponse,
  username: string
): ChessComGame => {
  return {
    gameId: extractGameId(game.url),
    username: username.toLowerCase(),
    pgn: game.pgn,
    date: game.end_time,
    result: getResultForUser(game, username),
    opponent: getOpponentUsername(game, username),
    color: getColorForUser(game, username),
    timeControl: game.time_control,
    timeClass: game.time_class,
  };
};

/**
 * Get the list of monthly archive URLs for a user
 */
const fetchArchiveUrls = async (username: string): Promise<string[]> => {
  const response = await fetch(
    `https://api.chess.com/pub/player/${username}/games/archives`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`User "${username}" not found on Chess.com`);
    }
    throw new Error(`Failed to fetch archives: ${response.statusText}`);
  }

  const data: ChessComArchivesResponse = await response.json();
  return data.archives;
};

/**
 * Fetch games from a specific monthly archive URL
 */
const fetchGamesFromArchive = async (
  archiveUrl: string
): Promise<ChessComGameResponse[]> => {
  const response = await fetch(archiveUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch games from archive: ${response.statusText}`);
  }

  const data: ChessComGamesResponse = await response.json();
  return data.games;
};

/**
 * Get the archive URL for a specific month
 */
const getArchiveUrlForMonth = (
  username: string,
  year: number,
  month: number
): string => {
  const monthStr = month.toString().padStart(2, "0");
  return `https://api.chess.com/pub/player/${username}/games/${year}/${monthStr}`;
};

/**
 * Get all archive URLs that fall within a date range
 */
const getArchiveUrlsInRange = (
  username: string,
  startDate: Date,
  endDate: Date
): string[] => {
  const urls: string[] = [];

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;

  for (let year = startYear; year <= endYear; year++) {
    const monthStart = year === startYear ? startMonth : 1;
    const monthEnd = year === endYear ? endMonth : 12;

    for (let month = monthStart; month <= monthEnd; month++) {
      urls.push(getArchiveUrlForMonth(username, year, month));
    }
  }

  return urls;
};

/**
 * Fetch and cache games for a user within a date range
 * Returns games from cache if available, otherwise fetches from API
 */
export const fetchChessComGames = async (
  username: string,
  startDate: Date,
  endDate: Date,
  timeClasses?: string[] // Filter by time class (e.g., ["rapid", "blitz"])
): Promise<ChessComGame[]> => {
  const normalizedUsername = username.toLowerCase();
  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  // First, check what we have in the cache
  const cachedGames = await db.chesscomGames
    .where("username")
    .equals(normalizedUsername)
    .and((game) => game.date >= startTimestamp && game.date <= endTimestamp)
    .toArray();

  // Build a set of cached game IDs for quick lookup
  const cachedGameIds = new Set(cachedGames.map((g) => g.gameId));

  // Get the archive URLs for the date range
  const archiveUrls = getArchiveUrlsInRange(username, startDate, endDate);

  // Fetch games from each archive that we don't already have
  const newGames: ChessComGame[] = [];

  for (const archiveUrl of archiveUrls) {
    try {
      const gamesFromArchive = await fetchGamesFromArchive(archiveUrl);

      for (const game of gamesFromArchive) {
        const gameId = extractGameId(game.url);

        // Skip if we already have this game cached
        if (cachedGameIds.has(gameId)) {
          continue;
        }

        // Skip if outside date range
        if (game.end_time < startTimestamp || game.end_time > endTimestamp) {
          continue;
        }

        const convertedGame = convertToChessComGame(game, normalizedUsername);
        newGames.push(convertedGame);
      }
    } catch (error) {
      // Log but continue - some archives might not exist yet
      console.warn(`Failed to fetch archive ${archiveUrl}:`, error);
    }
  }

  // Cache the new games
  if (newGames.length > 0) {
    await db.chesscomGames.bulkPut(newGames);
  }

  // Combine cached and new games
  let allGames = [...cachedGames, ...newGames];

  // Filter by time class if specified
  if (timeClasses && timeClasses.length > 0) {
    allGames = allGames.filter((game) => timeClasses.includes(game.timeClass));
  }

  // Sort by date (most recent first)
  allGames.sort((a, b) => b.date - a.date);

  return allGames;
};

/**
 * Clear all cached games for a user
 */
export const clearCachedGames = async (username: string): Promise<void> => {
  await db.chesscomGames
    .where("username")
    .equals(username.toLowerCase())
    .delete();
};

/**
 * Get cached game count for a user
 */
export const getCachedGameCount = async (username: string): Promise<number> => {
  return await db.chesscomGames
    .where("username")
    .equals(username.toLowerCase())
    .count();
};

