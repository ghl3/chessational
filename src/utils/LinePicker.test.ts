import { Chapter } from "@/chess/Chapter";
import { pickLine, getNumberOfLines, lineToSan } from "./LinePicker";
import { Line } from "@/chess/Line";
import { parsePgnStringToChapters } from "./PgnParser";

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

describe("getNumberOfLines", () => {
  it("should get the correct number of lines", () => {
    const chapter: Chapter = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3 Nf6 (2... Nc6) *`
    )[0];

    expect(getNumberOfLines(chapter.positionTree)).toEqual(2);
  });

  it("should get the correct number of lines for pirc", () => {
    const chapter: Chapter = parsePgnStringToChapters(
      `[Orientation "white"]
      1. d4 Nf6 (1... d6 2. e4 {1} ) (1... g6 2. e4 Bg7 3. Nc3 {2} ) 2. Nc3 g6 (2... d6 3. e4 {3}) 3. e4 {4} *`
    )[0];
    expect(getNumberOfLines(chapter.positionTree)).toEqual(4);
  });
});
