import { Chapter } from "@/chess/Chapter";
import { Line, lineToSan } from "@/chess/Line";
import { getLinesFromChapters } from "./LineExtractor";
import { parsePgnStringToChapters } from "./PgnParser";

const parseToLines = (pgn: string): Line[] => {
  const chapters: Chapter[] = parsePgnStringToChapters(pgn);
  const chapterAndLines = getLinesFromChapters("", chapters);
  const lines = [];
  for (let chapterAndLine of chapterAndLines) {
    lines.push(...chapterAndLine.lines);
  }
  return lines;
};

describe("pickLine", () => {
  it("should pick the one line", () => {
    const lines: Line[] = parseToLines(
      `[Orientation "black"]
        1. e4 e5 2. Nf3 Nc6 *`,
    );

    expect(lines.map(lineToSan)).toEqual([["e4", "e5", "Nf3", "Nc6"]]);
  });

  it("should terminate line that doesn't have child moves ", () => {
    const lines: Line[] = parseToLines(
      `[Orientation "white"]
          1. e4 e5 2. Nf3 Nc6 *`,
    );

    expect(lines.map(lineToSan)).toEqual([["e4", "e5", "Nf3"]]);
  });

  it("should move to transposition", () => {
    const lines: Line[] = parseToLines(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6 4. d4 exd4)
           2... Nc6 3. Nc3 Nf6 *`,
    );

    expect(lines.map(lineToSan)).toEqual([
      ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "d4", "exd4"],
      ["e4", "e5", "Nc3", "Nc6", "Nf3", "Nf6", "d4", "exd4"],
    ]);
  });

  it("should avoid infinite loop in tranpositions", () => {
    const lines: Line[] = parseToLines(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6)
           2... Nc6 3. Nc3 Nf6 *`,
    );

    expect(lines.map(lineToSan)).toEqual([
      ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"],
      ["e4", "e5", "Nc3", "Nc6", "Nf3", "Nf6"],
    ]);
  });

  it("truncate lines that don't end with current player's move", () => {
    const lines: Line[] = parseToLines(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6 4. d4)
           2... Nc6 3. Nc3 Nf6 *`,
    );

    expect(lines.map(lineToSan)).toEqual([
      ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"],
      ["e4", "e5", "Nc3", "Nc6", "Nf3", "Nf6"],
    ]);
  });

  it("picks the first line when there are multiple player moves", () => {
    const lines: Line[] = parseToLines(
      `[Orientation "black"]
      1. e4 e5 2. Nf3 Nf6 (2... Nc6) *`,
    );

    expect(lines.map(lineToSan)).toEqual([["e4", "e5", "Nf3", "Nf6"]]);
  });

  // Create a test that has a cross-chapter transposition
  it("should move to transposition across chapters", () => {
    const lines: Line[] = parseToLines(
      `[Orientation "white"]
      1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bc4 *
           
      [Orientation "white"]
      1. e4 e5 2. Nf3 Nf6 3. Nc3 d5 ( 3... Nc6) 4. exd5 *`,
    );

    expect(lines.map(lineToSan)).toEqual([
      ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "Bc4"],
      ["e4", "e5", "Nf3", "Nf6", "Nc3", "d5", "exd5"],
      ["e4", "e5", "Nf3", "Nf6", "Nc3", "Nc6", "Bc4"],
    ]);
  });
});
