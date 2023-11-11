type Message = string;

type InfoScore = { cp?: number; mate?: number };

export type ReadyMessage = { type: "READY" };
export type EngineLoadedMessage = { type: "ENGINE_LOADED" };
export type InfoMessage = {
  type: "INFO";
  pv: string[];
  score: InfoScore;
  depth: number;
  multipv?: number;
};
export type BestMoveMessage = {
  type: "BESTMOVE";
  from: string;
  to: string;
  promotion?: string;
};
export type NoMoveMessage = { type: "NOMOVE" };
export type IsMateMessage = { type: "ISMATE" };
export type UnknownMessage = { type: "UNKNOWN" };
export type ParsedMessage =
  | ReadyMessage
  | EngineLoadedMessage
  | InfoMessage
  | BestMoveMessage
  | NoMoveMessage
  | IsMateMessage
  | UnknownMessage;

// Based on:
// http://wbec-ridderkerk.nl/html/UCIProtocol.html
// https://gist.github.com/aliostad/f4470274f39d29b788c1b09519e67372
export class EventParser {
  static parse = (msg: Message): ParsedMessage => {
    if (msg === "uciok") {
      return { type: "ENGINE_LOADED" };
    }

    if (msg === "readyok") {
      return { type: "READY" };
    }

    const info = msg.match(/^info.*/);
    if (info) {
      return EventParser.parseInfo(msg);
    }

    const bestmove = msg.match(/^bestmove\s([a-h][1-8])([a-h][1-8])([a-z])?/);
    if (bestmove) {
      if (bestmove[3] !== undefined) {
        return {
          type: "BESTMOVE",
          from: bestmove[1],
          to: bestmove[2],
          promotion: bestmove[3],
        };
      } else {
        return { type: "BESTMOVE", from: bestmove[1], to: bestmove[2] };
      }
    }

    const nomove = msg.match(/^bestmove \(none\)/);
    if (nomove) {
      return { type: "NOMOVE" };
    }

    return { type: "UNKNOWN" };
  };

  static parseInfo = (info_log: string): InfoMessage => {
    const keywords = [
      "depth",
      "seldepth",
      "time",
      "nodes",
      "pv",
      "multipv",
      "score",
      "currmove",
      "currmovenumber",
      "bmc",
      "hashfull",
      "nps",
      "tbhits",
      "sbhits",
      "cpuload",
      "string",
      "refutation",
      "currline",
    ];

    const tokens = info_log
      .trim()
      .replaceAll("'", "")
      .replaceAll('"', "")
      .split(/\s+/);

    let info_map: { [key: string]: any } = { type: "INFO" };

    let currently_processing: string | null = null;
    let current_tokens: string[] = [];

    for (const token of tokens) {
      if (currently_processing != null) {
        if (!keywords.includes(token)) {
          current_tokens.push(token);
          continue;
        } else {
          info_map[currently_processing] = EventParser.handleInfo(
            currently_processing,
            current_tokens,
          );
          current_tokens = [];
          currently_processing = null;
        }
      }

      if (token === "info") {
        continue;
      } else if (keywords.includes(token)) {
        currently_processing = token;
      }
    }

    // Handle the last token
    if (currently_processing != null) {
      info_map[currently_processing] = EventParser.handleInfo(
        currently_processing,
        current_tokens,
      );
    }

    return info_map as InfoMessage;
  };

  static handleInfo = (token_type: string, tokens: string[]) => {
    if (token_type === "score") {
      return EventParser.handleInfoScore(tokens);
    } else if (token_type === "pv") {
      return EventParser.handleInfoPv(tokens);
    } else if (token_type === "multipv") {
      return EventParser.handleInfoMultiPv(tokens);
    } else {
      return EventParser.handleSingleValue(tokens);
    }
  };

  static handleInfoScore = (tokens: string[]): InfoScore | null => {
    // Score modifiers: (cp, mate, lowerbound, upperbound)
    if (tokens[0] === "cp") {
      return { cp: Number(tokens[1]) };
    } else if (tokens[0] === "mate") {
      return { mate: Number(tokens[1]) };
    } else {
      throw new Error(`Unexpected tokens: ${tokens}`);
    }
  };

  static handleInfoPv = (tokens: string[]): string[] => {
    return tokens;
  };

  static handleInfoMultiPv = (tokens: string[]): number => {
    return Number(tokens[0]);
  };

  static handleSingleValue = (tokens: string[]): number => {
    return Number(tokens[0]);
  };
}
