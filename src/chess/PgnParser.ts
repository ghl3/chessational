import { parse, ParsedPGN } from "pgn-parser";

export const convertGameToTree = (game: ParsedPGN) => {
  game.moves;
};

export const parsePgnString = (pgn: string) => {
  const parsedGames = parse(pgn);
  return parsedGames.map(convertGameToTree);
};
