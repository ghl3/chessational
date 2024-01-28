import { Chapter } from "@/chess/Chapter";
import { Line, lineToSan } from "@/chess/Line";
import { getLinesFromChapters } from "./LineExtractor";
import { pickLine } from "./LinePicker";
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
    const lines: Line[] = parseToLines(`[Orientation "black"]
    1. e4 e5 2. Nf3 Nc6 *`);

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6"]);
  });

  it("should terminate line that doesn't have chiild moves ", () => {
    const lines: Line[] = parseToLines(
      `[Orientation "white"]
          1. e4 e5 2. Nf3 Nc6 *`,
    );

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3"]);
  });

  it("should move to transposition", () => {
    const lines: Line[] = parseToLines(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6 4. d4 exd4)
           2... Nc6 3. Nc3 Nf6 *`,
    );

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual([
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Nc3",
      "Nf6",
      "d4",
      "exd4",
    ]);
  });

  it("should avoid infinite loop in tranpositions", () => {
    const lines: Line[] = parseToLines(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6)
           2... Nc6 3. Nc3 Nf6 *`,
    );

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"]);
  });

  it("don't go to transposition with no grand children", () => {
    const lines: Line[] = parseToLines(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6 4. d4)
           2... Nc6 3. Nc3 Nf6 *`,
    );

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"]);
  });

  it("picks the first line when multiple player moves available", () => {
    const lines: Line[] = parseToLines(
      `[Orientation "black"]
      1. e4 e5 2. Nf3 Nf6 (2... Nc6) *`,
    );

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nf6"]);
  });
});
