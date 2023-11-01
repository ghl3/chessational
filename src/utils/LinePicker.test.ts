import { Chapter } from "@/chess/Chapter";
import { WHITE, BLACK } from "chess.js";
import { pickLine } from "./LinePicker";
import { Line } from "@/chess/Line";
import { parsePgnStringToChapters } from "./PgnParser";

const lineToSan = (line: Line): string[] => {
  return line.moves.map((move) => move.move);
};

// Test getNumberOfLines
describe("pickLine", () => {
  it("should pick the one line", () => {
    const chapters: Chapter[] = parsePgnStringToChapters(
      `[Orientation "black"]
        1. e4 e5 2. Nf3 Nc6 *`
    );

    const line = pickLine(chapters, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6"]);
  });

  it("should terminate line that doesn't have chiild moves ", () => {
    const chapters: Chapter[] = parsePgnStringToChapters(
      `[Orientation "white"]
          1. e4 e5 2. Nf3 Nc6 *`
    );

    const line = pickLine(chapters, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3"]);
  });

  it("should move to transposition", () => {
    const chapters: Chapter[] = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6 4. d4 exd4)
           2... Nc6 3. Nc3 Nf6 *`
    );

    const line = pickLine(chapters, "DETERMINISTIC");
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
    const chapters: Chapter[] = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6)
           2... Nc6 3. Nc3 Nf6 *`
    );

    const line = pickLine(chapters, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"]);
  });

  it("don't go to transposition with no grand children", () => {
    const chapters: Chapter[] = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6 4. d4)
           2... Nc6 3. Nc3 Nf6 *`
    );

    const line = pickLine(chapters, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"]);
  });

  it("throws error when multiple player moves available", () => {
    const chapters: Chapter[] = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3 Nf6 (2... Nc6) *`
    );

    expect(() => pickLine(chapters, "DETERMINISTIC")).toThrow();
  });
});
