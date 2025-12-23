import { Chapter } from "@/chess/Chapter";
import { Line, lineToSan } from "@/chess/Line";
import { Attempt } from "@/chess/Attempt";
import { WHITE } from "chess.js";
import { getLinesFromChapters } from "./LineExtractor";
import {
  calculateLinePriorities,
  findLastAttempt,
  makeNoise,
  pickElementWithMaxWeight,
  pickLine,
  SpacedRepetitionConfig,
  weightedPick,
} from "./LinePicker";
import { parsePgnStringToChapters } from "./PgnParser";

const parseToLines = (pgn: string): Line[] => {
  const chapters: Chapter[] = parsePgnStringToChapters(pgn);
  const chapterAndLines = getLinesFromChapters("", chapters);
  return chapterAndLines.flatMap((cl) => cl.lines);
};

describe("pickLine - basic strategies", () => {
  it("picks the first line with DETERMINISTIC strategy", () => {
    const lines = parseToLines(`[Orientation "black"]
      1. e4 e5 2. Nf3 Nc6 *`);

    const line = pickLine(lines, "DETERMINISTIC");

    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6"]);
  });

  it("terminates line at last move for player's color", () => {
    const lines = parseToLines(`[Orientation "white"]
      1. e4 e5 2. Nf3 Nc6 *`);

    const line = pickLine(lines, "DETERMINISTIC");

    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3"]);
  });

  it("handles transpositions correctly", () => {
    const lines = parseToLines(`[Orientation "black"]
      1. e4 e5 2. Nf3
        (2. Nc3 Nc6 3. Nf3 Nf6 4. d4 exd4)
        2... Nc6 3. Nc3 Nf6 *`);

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

  it("avoids infinite loops in transpositions", () => {
    const lines = parseToLines(`[Orientation "black"]
      1. e4 e5 2. Nf3
        (2. Nc3 Nc6 3. Nf3 Nf6)
        2... Nc6 3. Nc3 Nf6 *`);

    const line = pickLine(lines, "DETERMINISTIC");

    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"]);
  });

  it("skips transpositions without grandchildren moves", () => {
    const lines = parseToLines(`[Orientation "black"]
      1. e4 e5 2. Nf3
        (2. Nc3 Nc6 3. Nf3 Nf6 4. d4)
        2... Nc6 3. Nc3 Nf6 *`);

    const line = pickLine(lines, "DETERMINISTIC");

    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"]);
  });

  it("picks first line when multiple player moves available", () => {
    const lines = parseToLines(`[Orientation "black"]
      1. e4 e5 2. Nf3 Nf6 (2... Nc6) *`);

    const line = pickLine(lines, "DETERMINISTIC");

    expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3", "Nf6"]);
  });

  it("throws error when no lines available", () => {
    expect(() => pickLine([], "DETERMINISTIC")).toThrow(
      "No lines to select from",
    );
  });
});

describe("makeNoise", () => {
  it("returns values within [-size, +size] range", () => {
    const size = 0.2;
    const samples = Array.from({ length: 100 }, () => makeNoise(size));

    samples.forEach((noise) => {
      expect(noise).toBeGreaterThanOrEqual(-size);
      expect(noise).toBeLessThanOrEqual(size);
    });
  });

  it("respects custom size parameter", () => {
    const size = 0.5;
    const samples = Array.from({ length: 100 }, () => makeNoise(size));

    samples.forEach((noise) => {
      expect(noise).toBeGreaterThanOrEqual(-size);
      expect(noise).toBeLessThanOrEqual(size);
    });
  });
});

describe("weightedPick", () => {
  it("throws for mismatched array lengths", () => {
    expect(() => weightedPick(["a", "b"], [1])).toThrow();
  });

  it("returns the only element when array has one item", () => {
    expect(weightedPick(["only"], [1])).toBe("only");
  });

  it("respects weights statistically", () => {
    const iterations = 10000;
    const counts = { a: 0, b: 0 };

    for (let i = 0; i < iterations; i++) {
      const picked = weightedPick(["a", "b"], [3, 1]) as "a" | "b";
      counts[picked]++;
    }

    const ratioA = counts.a / iterations;
    expect(ratioA).toBeGreaterThan(0.7);
    expect(ratioA).toBeLessThan(0.8);
  });
});

describe("pickElementWithMaxWeight", () => {
  it("throws for mismatched array lengths", () => {
    expect(() => pickElementWithMaxWeight(["a", "b"], [1])).toThrow();
  });

  it.each([
    { elements: ["a", "b", "c"], weights: [1, 5, 2], expected: "b" },
    { elements: ["x", "y", "z"], weights: [10, 3, 7], expected: "x" },
    { elements: ["p", "q"], weights: [0.1, 0.9], expected: "q" },
  ])(
    "picks element with highest weight: $elements with $weights -> $expected",
    ({ elements, weights, expected }) => {
      expect(pickElementWithMaxWeight(elements, weights)).toBe(expected);
    },
  );

  it("picks first element when all weights are equal", () => {
    expect(pickElementWithMaxWeight(["a", "b", "c"], [1, 1, 1])).toBe("a");
  });
});

describe("findLastAttempt", () => {
  it("returns null for empty array", () => {
    expect(findLastAttempt([])).toBeNull();
  });

  it("finds the most recent attempt regardless of array order", () => {
    const attempts: Attempt[] = [
      { studyName: "s", chapterName: "c", lineId: "line1", correct: true, timestamp: new Date("2024-01-01") },
      { studyName: "s", chapterName: "c", lineId: "line2", correct: false, timestamp: new Date("2024-01-15") },
      { studyName: "s", chapterName: "c", lineId: "line3", correct: true, timestamp: new Date("2024-01-10") },
    ];

    const last = findLastAttempt(attempts);

    expect(last?.lineId).toBe("line2");
    expect(last?.timestamp).toEqual(new Date("2024-01-15"));
  });
});

describe("pickLine - SPACED_REPETITION strategy", () => {
  describe("initial state (no attempts)", () => {
    it("picks randomly when no attempts exist", () => {
      const lines: Line[] = [
        { studyName: "study1", chapterName: "chapter1", lineId: "line1", orientation: WHITE, positions: [] },
        { studyName: "study1", chapterName: "chapter1", lineId: "line2", orientation: WHITE, positions: [] },
        { studyName: "study1", chapterName: "chapter1", lineId: "line3", orientation: WHITE, positions: [] },
      ];
      const config: SpacedRepetitionConfig = {
        currentTime: new Date("2024-06-15"),
        halfLifeDays: 28,
        stalenessWeight: 0.3,
        noiseSize: 0.5,
      };

      const picks = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const line = pickLine(lines, "SPACED_REPETITION", [], config);
        picks.add(line.lineId);
      }

      expect(picks.size).toBeGreaterThan(1);
    });
  });

  describe("failure retry behavior", () => {
    it("immediately retries a line after failure", () => {
      const lines: Line[] = [
        { studyName: "study1", chapterName: "chapter1", lineId: "line1", orientation: WHITE, positions: [] },
        { studyName: "study1", chapterName: "chapter1", lineId: "line2", orientation: WHITE, positions: [] },
        { studyName: "study1", chapterName: "chapter1", lineId: "line3", orientation: WHITE, positions: [] },
      ];
      const now = new Date("2024-06-15");
      const attempts: Attempt[] = [
        { studyName: "study1", chapterName: "chapter1", lineId: "line2", correct: false, timestamp: now },
      ];
      const config: SpacedRepetitionConfig = {
        currentTime: now,
        halfLifeDays: 28,
        stalenessWeight: 0.3,
        noiseSize: 0,
      };

      for (let i = 0; i < 10; i++) {
        const line = pickLine(lines, "SPACED_REPETITION", attempts, config);
        expect(line.lineId).toBe("line2");
      }
    });

    it("falls back to normal selection if failed line was removed", () => {
      const lines: Line[] = [
        { studyName: "study1", chapterName: "chapter1", lineId: "line1", orientation: WHITE, positions: [] },
        { studyName: "study1", chapterName: "chapter1", lineId: "line3", orientation: WHITE, positions: [] },
      ];
      const now = new Date("2024-06-15");
      const attempts: Attempt[] = [
        { studyName: "study1", chapterName: "chapter1", lineId: "line2", correct: false, timestamp: now },
      ];
      const config: SpacedRepetitionConfig = {
        currentTime: now,
        halfLifeDays: 28,
        stalenessWeight: 0.3,
        noiseSize: 0,
      };

      const line = pickLine(lines, "SPACED_REPETITION", attempts, config);

      expect(["line1", "line3"]).toContain(line.lineId);
    });
  });

  describe("priority-based selection", () => {
    it("prioritizes never-practiced lines over practiced ones", () => {
      const lines: Line[] = [
        { studyName: "study1", chapterName: "chapter1", lineId: "practiced", orientation: WHITE, positions: [] },
        { studyName: "study1", chapterName: "chapter1", lineId: "never1", orientation: WHITE, positions: [] },
        { studyName: "study1", chapterName: "chapter1", lineId: "never2", orientation: WHITE, positions: [] },
      ];
      const now = new Date("2024-06-15");
      const attempts: Attempt[] = [
        { studyName: "study1", chapterName: "chapter1", lineId: "practiced", correct: true, timestamp: now },
        { studyName: "study1", chapterName: "chapter1", lineId: "practiced", correct: true, timestamp: now },
      ];
      const config: SpacedRepetitionConfig = {
        currentTime: now,
        halfLifeDays: 28,
        stalenessWeight: 0.3,
        noiseSize: 0.1,
      };

      let neverPickedCount = 0;
      for (let i = 0; i < 20; i++) {
        const line = pickLine(lines, "SPACED_REPETITION", attempts, config);
        if (line.lineId !== "practiced") {
          neverPickedCount++;
        }
      }

      expect(neverPickedCount).toBeGreaterThan(10);
    });

    it("prioritizes weak lines over strong ones", () => {
      const lines: Line[] = [
        { studyName: "study1", chapterName: "chapter1", lineId: "weak", orientation: WHITE, positions: [] },
        { studyName: "study1", chapterName: "chapter1", lineId: "strong", orientation: WHITE, positions: [] },
      ];
      const now = new Date("2024-06-15");
      const attempts: Attempt[] = [
        { studyName: "study1", chapterName: "chapter1", lineId: "weak", correct: true, timestamp: now },
        { studyName: "study1", chapterName: "chapter1", lineId: "weak", correct: false, timestamp: now },
        { studyName: "study1", chapterName: "chapter1", lineId: "weak", correct: false, timestamp: now },
        { studyName: "study1", chapterName: "chapter1", lineId: "weak", correct: false, timestamp: now },
        { studyName: "study1", chapterName: "chapter1", lineId: "strong", correct: true, timestamp: now },
        { studyName: "study1", chapterName: "chapter1", lineId: "strong", correct: true, timestamp: now },
        { studyName: "study1", chapterName: "chapter1", lineId: "strong", correct: true, timestamp: now },
        { studyName: "study1", chapterName: "chapter1", lineId: "strong", correct: true, timestamp: now },
      ];
      const config: SpacedRepetitionConfig = {
        currentTime: now,
        halfLifeDays: 28,
        stalenessWeight: 0.3,
        noiseSize: 0,
      };

      const line = pickLine(lines, "SPACED_REPETITION", attempts, config);

      expect(line.lineId).toBe("weak");
    });

    it("prioritizes stale lines when staleness weight is high", () => {
      const now = new Date("2024-06-15T12:00:00Z");
      const twoMonthsAgo = new Date("2024-04-15T12:00:00Z");
      const lines: Line[] = [
        { studyName: "study1", chapterName: "chapter1", lineId: "recent", orientation: WHITE, positions: [] },
        { studyName: "study1", chapterName: "chapter1", lineId: "stale", orientation: WHITE, positions: [] },
      ];
      const attempts: Attempt[] = [
        { studyName: "study1", chapterName: "chapter1", lineId: "recent", correct: true, timestamp: now },
        { studyName: "study1", chapterName: "chapter1", lineId: "recent", correct: true, timestamp: now },
        { studyName: "study1", chapterName: "chapter1", lineId: "stale", correct: true, timestamp: twoMonthsAgo },
        { studyName: "study1", chapterName: "chapter1", lineId: "stale", correct: true, timestamp: twoMonthsAgo },
      ];
      const config: SpacedRepetitionConfig = {
        currentTime: now,
        halfLifeDays: 28,
        stalenessWeight: 0.5,
        noiseSize: 0,
      };

      const line = pickLine(lines, "SPACED_REPETITION", attempts, config);

      expect(line.lineId).toBe("stale");
    });
  });
});

describe("calculateLinePriorities", () => {
  it("assigns maximum priority (1.0) to never-practiced lines", () => {
    const lines: Line[] = [
      { studyName: "study1", chapterName: "chapter1", lineId: "line1", orientation: WHITE, positions: [] },
      { studyName: "study1", chapterName: "chapter1", lineId: "line2", orientation: WHITE, positions: [] },
    ];
    const now = new Date("2024-06-15");
    const config: SpacedRepetitionConfig = {
      currentTime: now,
      halfLifeDays: 28,
      stalenessWeight: 0.3,
      noiseSize: 0,
    };

    const priorities = calculateLinePriorities(lines, [], config);

    expect(priorities).toHaveLength(2);
    priorities.forEach((p) => {
      expect(p.priority).toBe(1.0);
      expect(p.stats).toBeNull();
    });
  });

  it("assigns lower priority to well-known lines", () => {
    const lines: Line[] = [
      { studyName: "study1", chapterName: "chapter1", lineId: "weak", orientation: WHITE, positions: [] },
      { studyName: "study1", chapterName: "chapter1", lineId: "strong", orientation: WHITE, positions: [] },
    ];
    const now = new Date("2024-06-15");
    const attempts: Attempt[] = [
      { studyName: "study1", chapterName: "chapter1", lineId: "weak", correct: false, timestamp: now },
      { studyName: "study1", chapterName: "chapter1", lineId: "weak", correct: false, timestamp: now },
      { studyName: "study1", chapterName: "chapter1", lineId: "strong", correct: true, timestamp: now },
      { studyName: "study1", chapterName: "chapter1", lineId: "strong", correct: true, timestamp: now },
    ];
    const config: SpacedRepetitionConfig = {
      currentTime: now,
      halfLifeDays: 28,
      stalenessWeight: 0.3,
      noiseSize: 0,
    };

    const priorities = calculateLinePriorities(lines, attempts, config);

    const weak = priorities.find((p) => p.line.lineId === "weak")!;
    const strong = priorities.find((p) => p.line.lineId === "strong")!;

    expect(weak.priority).toBeGreaterThan(strong.priority);
    expect(weak.stats).not.toBeNull();
    expect(strong.stats).not.toBeNull();
  });

  it("factors in staleness when calculating priority", () => {
    const now = new Date("2024-06-15T12:00:00Z");
    const monthAgo = new Date("2024-05-15T12:00:00Z");
    const lines: Line[] = [
      { studyName: "study1", chapterName: "chapter1", lineId: "recent", orientation: WHITE, positions: [] },
      { studyName: "study1", chapterName: "chapter1", lineId: "stale", orientation: WHITE, positions: [] },
    ];
    const attempts: Attempt[] = [
      { studyName: "study1", chapterName: "chapter1", lineId: "recent", correct: true, timestamp: now },
      { studyName: "study1", chapterName: "chapter1", lineId: "stale", correct: true, timestamp: monthAgo },
    ];
    const config: SpacedRepetitionConfig = {
      currentTime: now,
      halfLifeDays: 28,
      stalenessWeight: 0.3,
      noiseSize: 0,
    };

    const priorities = calculateLinePriorities(lines, attempts, config);

    const recent = priorities.find((p) => p.line.lineId === "recent")!;
    const stale = priorities.find((p) => p.line.lineId === "stale")!;

    expect(stale.priority).toBeGreaterThan(recent.priority);
  });
});
