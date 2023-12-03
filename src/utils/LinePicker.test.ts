import { Chapter } from "@/chess/Chapter";
import { lineToSan } from "@/chess/Line";
import { ChapterAndTree } from "@/chess/StudyChapterAndLines";
import { getLinesForPlayer } from "./LineExtractor";
import { pickLine } from "./LinePicker";
import { parsePgnStringToChapters } from "./PgnParser";

describe("pickLine", () => {
  it("should pick the one line", () => {
    const chapters: ChapterAndTree[] = parsePgnStringToChapters(
      `[Orientation "black"]
        1. e4 e5 2. Nf3 Nc6 *`,
    );
    const lines = getLinesForPlayer(
      "",
      chapters[0].chapter,
      chapters[0].tree,
      chapters[0].chapter.orientation,
    );

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6"]);
  });

  it("should terminate line that doesn't have chiild moves ", () => {
    const chapters: ChapterAndTree[] = parsePgnStringToChapters(
      `[Orientation "white"]
          1. e4 e5 2. Nf3 Nc6 *`,
    );
    const lines = getLinesForPlayer(
      "",
      chapters[0].chapter,
      chapters[0].tree,
      chapters[0].chapter.orientation,
    );

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3"]);
  });

  it("should move to transposition", () => {
    const chapters: ChapterAndTree[] = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6 4. d4 exd4)
           2... Nc6 3. Nc3 Nf6 *`,
    );
    const lines = getLinesForPlayer(
      "",
      chapters[0].chapter,
      chapters[0].tree,
      chapters[0].chapter.orientation,
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
    const chapters: ChapterAndTree[] = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6)
           2... Nc6 3. Nc3 Nf6 *`,
    );
    const lines = getLinesForPlayer(
      "",
      chapters[0].chapter,
      chapters[0].tree,
      chapters[0].chapter.orientation,
    );

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"]);
  });

  it("don't go to transposition with no grand children", () => {
    const chapters: ChapterAndTree[] = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6 4. d4)
           2... Nc6 3. Nc3 Nf6 *`,
    );
    const lines = getLinesForPlayer(
      "",
      chapters[0].chapter,
      chapters[0].tree,
      chapters[0].chapter.orientation,
    );

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"]);
  });

  it("picks the first line when multiple player moves available", () => {
    const chapters: ChapterAndTree[] = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3 Nf6 (2... Nc6) *`,
    );
    const lines = getLinesForPlayer(
      "",
      chapters[0].chapter,
      chapters[0].tree,
      chapters[0].chapter.orientation,
    );

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nf6"]);
  });
});
