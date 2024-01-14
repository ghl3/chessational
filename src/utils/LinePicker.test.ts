import { Chapter } from "@/chess/Chapter";
import { lineToSan } from "@/chess/Line";
import { getLinesForPlayer } from "./LineExtractor";
import { calculateProbability, pickLine } from "./LinePicker";
import { parsePgnStringToChapters } from "./PgnParser";

describe("pickLine", () => {
  it("should pick the one line", () => {
    const chapters: Chapter[] = parsePgnStringToChapters(
      `[Orientation "black"]
        1. e4 e5 2. Nf3 Nc6 *`,
    );
    const lines = getLinesForPlayer("", chapters[0]);

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6"]);
  });

  it("should terminate line that doesn't have chiild moves ", () => {
    const chapters: Chapter[] = parsePgnStringToChapters(
      `[Orientation "white"]
          1. e4 e5 2. Nf3 Nc6 *`,
    );
    const lines = getLinesForPlayer("", chapters[0]);

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3"]);
  });

  it("should move to transposition", () => {
    const chapters: Chapter[] = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6 4. d4 exd4)
           2... Nc6 3. Nc3 Nf6 *`,
    );
    const lines = getLinesForPlayer("", chapters[0]);

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
    const chapters: Chapter[] = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6)
           2... Nc6 3. Nc3 Nf6 *`,
    );
    const lines = getLinesForPlayer("", chapters[0]);

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"]);
  });

  it("don't go to transposition with no grand children", () => {
    const chapters: Chapter[] = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3
          (2. Nc3 Nc6 3. Nf3 Nf6 4. d4)
           2... Nc6 3. Nc3 Nf6 *`,
    );
    const lines = getLinesForPlayer("", chapters[0]);

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"]);
  });

  it("picks the first line when multiple player moves available", () => {
    const chapters: Chapter[] = parsePgnStringToChapters(
      `[Orientation "black"]
      1. e4 e5 2. Nf3 Nf6 (2... Nc6) *`,
    );
    const lines = getLinesForPlayer("", chapters[0]);

    const line = pickLine(lines, "DETERMINISTIC");
    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nf6"]);
  });
});

describe("calculateProbability", () => {
  const baseAttempt = {
    studyName: "study1",
    chapterName: "chapter1",
    timestamp: new Date(),
  };

  it("returns default probability when no attempts match the lineId", () => {
    const attempts = [
      { ...baseAttempt, lineId: "otherLine", correct: true },
      { ...baseAttempt, lineId: "otherLine", correct: false },
    ];
    expect(calculateProbability("line1", attempts)).toBe(0.5);
  });

  it("returns higher probability for recent correct attempts", () => {
    const attempts = [
      { ...baseAttempt, lineId: "line1", correct: false },
      { ...baseAttempt, lineId: "line1", correct: true },
      { ...baseAttempt, lineId: "line1", correct: true },
    ];
    expect(calculateProbability("line1", attempts)).toBeGreaterThan(0.5);
  });

  // ...other test cases...

  it("handles cases with high confidence threshold", () => {
    const attempts = [
      { ...baseAttempt, lineId: "line1", correct: true },
      { ...baseAttempt, lineId: "line1", correct: true },
      { ...baseAttempt, lineId: "line1", correct: false },
    ];
    const highThreshold = 0.95;
    const result = calculateProbability("line1", attempts, highThreshold);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("handles cases with low confidence threshold", () => {
    const attempts = [
      { ...baseAttempt, lineId: "line1", correct: false },
      { ...baseAttempt, lineId: "line1", correct: false },
      { ...baseAttempt, lineId: "line1", correct: true },
    ];
    const lowThreshold = 0.85;
    const result = calculateProbability("line1", attempts, lowThreshold);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  // ...any other specific test cases you'd like to include...
});
