import { Chapter } from "@/chess/Chapter";
import { getLinesForPlayer } from "./LineExtractor";
import { lineToSan } from "@/chess/Line";
import { parsePgnStringToChapters } from "./PgnParser";

describe("pickLine", () => {
  it("should pick the one line", () => {
    const chapter: Chapter = parsePgnStringToChapters(
      `[Orientation "black"]
        1. e4 e5 2. Nf3 Nc6 *`,
    )[0];

    const lines = getLinesForPlayer(chapter.positionTree, chapter.orientation);
    expect(lines.map(lineToSan)).toEqual([["e4", "e5", "Nf3", "Nc6"]]);
  });

  it("should terminate line that doesn't have child moves ", () => {
    const chapter: Chapter = parsePgnStringToChapters(
      `[Orientation "white"]
          1. e4 e5 2. Nf3 Nc6 *`,
    )[0];

    const lines = getLinesForPlayer(chapter.positionTree, chapter.orientation);
    expect(lines.map(lineToSan)).toEqual([["e4", "e5", "Nf3"]]);
  });

  it("should move to transposition", () => {
    const chapter: Chapter = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6 4. d4 exd4)
           2... Nc6 3. Nc3 Nf6 *`,
    )[0];

    const lines = getLinesForPlayer(chapter.positionTree, chapter.orientation);
    expect(lines.map(lineToSan)).toEqual([
      ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "d4", "exd4"],
      ["e4", "e5", "Nc3", "Nc6", "Nf3", "Nf6", "d4", "exd4"],
    ]);
  });

  it("should avoid infinite loop in tranpositions", () => {
    const chapter: Chapter = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6)
           2... Nc6 3. Nc3 Nf6 *`,
    )[0];

    const lines = getLinesForPlayer(chapter.positionTree, chapter.orientation);
    expect(lines.map(lineToSan)).toEqual([
      ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"],
      ["e4", "e5", "Nc3", "Nc6", "Nf3", "Nf6"],
    ]);
  });

  it("truncate lines that don't end with current player's move", () => {
    const chapter: Chapter = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6 4. d4)
           2... Nc6 3. Nc3 Nf6 *`,
    )[0];

    const lines = getLinesForPlayer(chapter.positionTree, chapter.orientation);
    expect(lines.map(lineToSan)).toEqual([
      ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"],
      ["e4", "e5", "Nc3", "Nc6", "Nf3", "Nf6"],
    ]);
  });

  it("picks the first line when there are multiple player moves", () => {
    const chapter: Chapter = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3 Nf6 (2... Nc6) *`,
    )[0];

    const lines = getLinesForPlayer(chapter.positionTree, chapter.orientation);
    expect(lines.map(lineToSan)).toEqual([["e4", "e5", "Nf3", "Nf6"]]);
  });
});
