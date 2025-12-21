import { Color } from "chess.js";

export type GameResultString = "win" | "loss" | "draw";

export interface ChessComGame {
  // Unique game ID from Chess.com
  gameId: string;
  // The username this game was fetched for
  username: string;
  // The PGN of the game
  pgn: string;
  // Unix timestamp of when the game was played
  date: number;
  // Game result from the perspective of the username
  result: GameResultString;
  // Opponent's username
  opponent: string;
  // Which color the user played
  color: Color;
  // Time control (e.g., "600", "180+2")
  timeControl: string;
  // Game type (e.g., "rapid", "blitz", "bullet")
  timeClass: string;
}

