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

// =============================================================================
// Test Fixtures & Helpers
// =============================================================================

/** Fixed reference date for consistent test results */
const TEST_DATE = new Date("2024-06-15T12:00:00Z");

/** Common time offsets */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Parses a PGN string and extracts all lines.
 * Used for integration-style tests with real PGN data.
 */
const parseToLines = (pgn: string): Line[] => {
  const chapters: Chapter[] = parsePgnStringToChapters(pgn);
  const chapterAndLines = getLinesFromChapters("", chapters);
  return chapterAndLines.flatMap((cl) => cl.lines);
};

/**
 * Creates a minimal Line object for unit testing.
 * Does not include positions - use parseToLines for full lines.
 */
const makeLine = (
  lineId: string,
  options: { chapterName?: string; studyName?: string } = {},
): Line => ({
  studyName: options.studyName ?? "study1",
  chapterName: options.chapterName ?? "chapter1",
  lineId,
  orientation: WHITE,
  positions: [],
});

/**
 * Creates an Attempt for testing.
 */
const makeAttempt = (
  lineId: string,
  correct: boolean,
  timestamp: Date = TEST_DATE,
  options: { studyName?: string; chapterName?: string } = {},
): Attempt => ({
  studyName: options.studyName ?? "study1",
  chapterName: options.chapterName ?? "chapter1",
  lineId,
  correct,
  timestamp,
});

/**
 * Creates a SpacedRepetitionConfig with test defaults.
 * noiseSize defaults to 0 for deterministic tests.
 */
const makeConfig = (
  overrides: Partial<SpacedRepetitionConfig> = {},
): SpacedRepetitionConfig => ({
  currentTime: TEST_DATE,
  halfLifeDays: 28,
  stalenessWeight: 0.3,
  noiseSize: 0, // Deterministic by default for testing
  ...overrides,
});

// =============================================================================
// pickLine - Basic Strategies (Integration Tests with Real PGN)
// =============================================================================

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

    // White orientation = ends after white's move (Nf3), not black's response
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

// =============================================================================
// Utility Functions
// =============================================================================

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
    // Note: This is a statistical test that could theoretically fail,
    // but with 10000 iterations the probability is negligible
    const iterations = 10000;
    const counts = { a: 0, b: 0 };

    for (let i = 0; i < iterations; i++) {
      const picked = weightedPick(["a", "b"], [3, 1]) as "a" | "b";
      counts[picked]++;
    }

    // With 3:1 weights, 'a' should be picked ~75% of the time
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
    const attempts = [
      makeAttempt("line1", true, new Date("2024-01-01")),
      makeAttempt("line2", false, new Date("2024-01-15")),
      makeAttempt("line3", true, new Date("2024-01-10")),
    ];

    const last = findLastAttempt(attempts);

    expect(last?.lineId).toBe("line2");
    expect(last?.timestamp).toEqual(new Date("2024-01-15"));
  });
});

// =============================================================================
// pickLine - SPACED_REPETITION Strategy
// =============================================================================

describe("pickLine - SPACED_REPETITION strategy", () => {
  describe("initial state (no attempts)", () => {
    it("picks randomly when no attempts exist", () => {
      const lines = [makeLine("line1"), makeLine("line2"), makeLine("line3")];
      const config = makeConfig({ noiseSize: 0.5 }); // Enable noise for randomness

      // Run multiple times to verify randomness
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
      const lines = [makeLine("line1"), makeLine("line2"), makeLine("line3")];
      const attempts = [makeAttempt("line2", false)];

      // Should always pick the failed line
      for (let i = 0; i < 10; i++) {
        const line = pickLine(
          lines,
          "SPACED_REPETITION",
          attempts,
          makeConfig(),
        );
        expect(line.lineId).toBe("line2");
      }
    });

    it("falls back to normal selection if failed line was removed", () => {
      const lines = [makeLine("line1"), makeLine("line3")]; // line2 not in list
      const attempts = [makeAttempt("line2", false)];

      const line = pickLine(
        lines,
        "SPACED_REPETITION",
        attempts,
        makeConfig(),
      );

      expect(["line1", "line3"]).toContain(line.lineId);
    });
  });

  describe("priority-based selection", () => {
    it("prioritizes never-practiced lines over practiced ones", () => {
      const lines = [
        makeLine("practiced"),
        makeLine("never1"),
        makeLine("never2"),
      ];
      const attempts = [
        makeAttempt("practiced", true),
        makeAttempt("practiced", true),
      ];
      const config = makeConfig({ noiseSize: 0.1 });

      // Run multiple times - should frequently pick never-practiced
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
      const lines = [makeLine("weak"), makeLine("strong")];
      const attempts = [
        // Weak: 1/4 = 25% success
        makeAttempt("weak", true),
        makeAttempt("weak", false),
        makeAttempt("weak", false),
        makeAttempt("weak", false),
        // Strong: 4/4 = 100% success
        makeAttempt("strong", true),
        makeAttempt("strong", true),
        makeAttempt("strong", true),
        makeAttempt("strong", true),
      ];

      const line = pickLine(
        lines,
        "SPACED_REPETITION",
        attempts,
        makeConfig(),
      );

      expect(line.lineId).toBe("weak");
    });

    it("prioritizes stale lines when staleness weight is high", () => {
      const lines = [makeLine("recent"), makeLine("stale")];
      const twoMonthsAgo = new Date(TEST_DATE.getTime() - 60 * ONE_DAY_MS);

      const attempts = [
        makeAttempt("recent", true, TEST_DATE),
        makeAttempt("recent", true, TEST_DATE),
        makeAttempt("stale", true, twoMonthsAgo),
        makeAttempt("stale", true, twoMonthsAgo),
      ];

      const line = pickLine(
        lines,
        "SPACED_REPETITION",
        attempts,
        makeConfig({ stalenessWeight: 0.5 }),
      );

      expect(line.lineId).toBe("stale");
    });
  });
});

// =============================================================================
// calculateLinePriorities
// =============================================================================

describe("calculateLinePriorities", () => {
  it("assigns maximum priority (1.0) to never-practiced lines", () => {
    const lines = [makeLine("line1"), makeLine("line2")];
    const attempts: Attempt[] = [];

    const priorities = calculateLinePriorities(lines, attempts, makeConfig());

    expect(priorities).toHaveLength(2);
    priorities.forEach((p) => {
      expect(p.priority).toBe(1.0);
      expect(p.stats).toBeNull();
    });
  });

  it("assigns lower priority to well-known lines", () => {
    const lines = [makeLine("weak"), makeLine("strong")];
    const attempts = [
      makeAttempt("weak", false),
      makeAttempt("weak", false),
      makeAttempt("strong", true),
      makeAttempt("strong", true),
    ];

    const priorities = calculateLinePriorities(lines, attempts, makeConfig());

    const weak = priorities.find((p) => p.line.lineId === "weak")!;
    const strong = priorities.find((p) => p.line.lineId === "strong")!;

    expect(weak.priority).toBeGreaterThan(strong.priority);
    expect(weak.stats).not.toBeNull();
    expect(strong.stats).not.toBeNull();
  });

  it("factors in staleness when calculating priority", () => {
    const lines = [makeLine("recent"), makeLine("stale")];
    const monthAgo = new Date(TEST_DATE.getTime() - 30 * ONE_DAY_MS);

    const attempts = [
      makeAttempt("recent", true, TEST_DATE),
      makeAttempt("stale", true, monthAgo),
    ];

    const priorities = calculateLinePriorities(lines, attempts, makeConfig());

    const recent = priorities.find((p) => p.line.lineId === "recent")!;
    const stale = priorities.find((p) => p.line.lineId === "stale")!;

    expect(stale.priority).toBeGreaterThan(recent.priority);
  });
});
