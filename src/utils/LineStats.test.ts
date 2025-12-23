import {
  calculateProbability,
  calculateReviewPriority,
  daysBetween,
  DEFAULT_HALFLIFE_DAYS,
  getStats,
  LineStats,
} from "./LineStats";
import { Attempt } from "../chess/Attempt";

// =============================================================================
// Test Fixtures & Helpers
// =============================================================================

/** Fixed reference date for consistent test results */
const TEST_DATE = new Date("2024-06-15T12:00:00Z");

/** Common time offsets for readability */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;
const ONE_MONTH_MS = 30 * ONE_DAY_MS;

/**
 * Creates a test attempt with sensible defaults.
 * All fields can be overridden via the options parameter.
 */
const makeAttempt = (
  options: Partial<Attempt> & { correct: boolean },
): Attempt => ({
  studyName: "study1",
  chapterName: "chapter1",
  lineId: "line1",
  timestamp: TEST_DATE,
  ...options,
});

/**
 * Creates a LineStats object with sensible defaults.
 * Useful for testing calculateReviewPriority in isolation.
 */
const makeStats = (overrides: Partial<LineStats> = {}): LineStats => ({
  study: "study1",
  chapter: "chapter1",
  lineId: "line1",
  numAttempts: 1,
  numCorrect: 1,
  numWrong: 0,
  latestAttempt: TEST_DATE,
  latestSuccess: TEST_DATE,
  rawSuccessRate: 1,
  estimatedSuccessRate: 0.75,
  daysSinceLastAttempt: 0,
  ...overrides,
});

// =============================================================================
// daysBetween
// =============================================================================

describe("daysBetween", () => {
  it("returns 0 for same date", () => {
    expect(daysBetween(TEST_DATE, TEST_DATE)).toBe(0);
  });

  it("returns correct days for dates in order", () => {
    const date1 = new Date("2024-01-01");
    const date2 = new Date("2024-01-08");
    expect(daysBetween(date1, date2)).toBe(7);
  });

  it("returns absolute value regardless of order", () => {
    const date1 = new Date("2024-01-01");
    const date2 = new Date("2024-01-08");
    expect(daysBetween(date2, date1)).toBe(7);
  });

  it("handles fractional days", () => {
    const date1 = new Date("2024-01-01T00:00:00Z");
    const date2 = new Date("2024-01-01T12:00:00Z");
    expect(daysBetween(date1, date2)).toBe(0.5);
  });
});

// =============================================================================
// calculateProbability
// =============================================================================

describe("calculateProbability", () => {
  describe("default behavior", () => {
    it("returns 0.5 when no attempts exist", () => {
      expect(calculateProbability([])).toBe(0.5);
    });

    it("returns custom default probability when specified", () => {
      expect(calculateProbability([], 0.7)).toBe(0.7);
    });
  });

  describe("success rate calculation", () => {
    it("returns higher probability for mostly correct attempts", () => {
      const attempts = [
        makeAttempt({ correct: false }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
      ];
      expect(calculateProbability(attempts)).toBeGreaterThan(0.5);
    });

    it("returns lower probability for mostly incorrect attempts", () => {
      const attempts = [
        makeAttempt({ correct: true }),
        makeAttempt({ correct: false }),
        makeAttempt({ correct: false }),
      ];
      expect(calculateProbability(attempts)).toBeLessThan(0.5);
    });
  });

  describe("time weighting", () => {
    it("weighs recent attempts more heavily than old ones", () => {
      const now = TEST_DATE;
      const monthAgo = new Date(now.getTime() - ONE_MONTH_MS);

      const attemptsRecentWrong = [
        makeAttempt({ correct: true, timestamp: monthAgo }),
        makeAttempt({ correct: false, timestamp: now }),
      ];

      const attemptsRecentCorrect = [
        makeAttempt({ correct: false, timestamp: monthAgo }),
        makeAttempt({ correct: true, timestamp: now }),
      ];

      const probRecentWrong = calculateProbability(
        attemptsRecentWrong,
        0.5,
        now,
      );
      const probRecentCorrect = calculateProbability(
        attemptsRecentCorrect,
        0.5,
        now,
      );

      expect(probRecentCorrect).toBeGreaterThan(probRecentWrong);
    });

    it("shorter half-life causes faster decay of old attempts", () => {
      const now = TEST_DATE;
      const weekAgo = new Date(now.getTime() - ONE_WEEK_MS);

      const attempts = [makeAttempt({ correct: true, timestamp: weekAgo })];

      const probShortHalflife = calculateProbability(attempts, 0.5, now, 7);
      const probLongHalflife = calculateProbability(attempts, 0.5, now, 28);

      // Shorter half-life = old attempts count less = closer to prior (0.5)
      expect(Math.abs(probShortHalflife - 0.5)).toBeLessThan(
        Math.abs(probLongHalflife - 0.5),
      );
    });
  });
});

// =============================================================================
// calculateReviewPriority
// =============================================================================

describe("calculateReviewPriority", () => {
  describe("unpracticed lines", () => {
    it("returns 1.0 for null stats", () => {
      expect(calculateReviewPriority(null, TEST_DATE)).toBe(1.0);
    });

    it("returns 1.0 for stats with zero attempts", () => {
      const stats = makeStats({ numAttempts: 0 });
      expect(calculateReviewPriority(stats, TEST_DATE)).toBe(1.0);
    });
  });

  describe("knowledge factor", () => {
    it.each([
      { knowledge: 0.9, expectedPriorityRange: [0, 0.2] },
      { knowledge: 0.5, expectedPriorityRange: [0.4, 0.6] },
      { knowledge: 0.1, expectedPriorityRange: [0.8, 1.0] },
    ])(
      "knowledge=$knowledge yields priority in range $expectedPriorityRange",
      ({ knowledge, expectedPriorityRange }) => {
        const stats = makeStats({
          estimatedSuccessRate: knowledge,
          daysSinceLastAttempt: 0,
        });
        const priority = calculateReviewPriority(stats, TEST_DATE);

        expect(priority).toBeGreaterThanOrEqual(expectedPriorityRange[0]);
        expect(priority).toBeLessThanOrEqual(expectedPriorityRange[1]);
      },
    );

    it("low knowledge lines have higher priority than high knowledge", () => {
      const lowKnowledge = makeStats({
        estimatedSuccessRate: 0.3,
        daysSinceLastAttempt: 0,
      });
      const highKnowledge = makeStats({
        estimatedSuccessRate: 0.9,
        daysSinceLastAttempt: 0,
      });

      expect(calculateReviewPriority(lowKnowledge, TEST_DATE)).toBeGreaterThan(
        calculateReviewPriority(highKnowledge, TEST_DATE),
      );
    });
  });

  describe("staleness factor", () => {
    it("stale lines have higher priority than recently reviewed", () => {
      const recent = makeStats({
        estimatedSuccessRate: 0.8,
        daysSinceLastAttempt: 1,
      });
      const stale = makeStats({
        estimatedSuccessRate: 0.8,
        daysSinceLastAttempt: 30,
      });

      expect(calculateReviewPriority(stale, TEST_DATE)).toBeGreaterThan(
        calculateReviewPriority(recent, TEST_DATE),
      );
    });

    it("staleness is capped at 3x half-life", () => {
      const veryStale = makeStats({
        estimatedSuccessRate: 0.8,
        daysSinceLastAttempt: 200, // Way past cap
      });
      const atCap = makeStats({
        estimatedSuccessRate: 0.8,
        daysSinceLastAttempt: 3 * DEFAULT_HALFLIFE_DAYS,
      });

      expect(calculateReviewPriority(veryStale, TEST_DATE)).toBeCloseTo(
        calculateReviewPriority(atCap, TEST_DATE),
        5,
      );
    });

    it("stalenessWeight parameter controls staleness contribution", () => {
      const stale = makeStats({
        estimatedSuccessRate: 0.8,
        daysSinceLastAttempt: 28,
      });

      const lowWeight = calculateReviewPriority(
        stale,
        TEST_DATE,
        DEFAULT_HALFLIFE_DAYS,
        0.1,
      );
      const highWeight = calculateReviewPriority(
        stale,
        TEST_DATE,
        DEFAULT_HALFLIFE_DAYS,
        0.5,
      );

      expect(highWeight).toBeGreaterThan(lowWeight);
    });
  });

  describe("knowledge vs staleness trade-offs (burst study behavior)", () => {
    it("very weak lines beat moderately stale lines", () => {
      const veryWeak = makeStats({
        estimatedSuccessRate: 0.15,
        daysSinceLastAttempt: 1,
      });
      const moderatelyStale = makeStats({
        estimatedSuccessRate: 0.85,
        daysSinceLastAttempt: 28,
      });

      expect(calculateReviewPriority(veryWeak, TEST_DATE)).toBeGreaterThan(
        calculateReviewPriority(moderatelyStale, TEST_DATE),
      );
    });

    it("very stale lines can overtake moderately weak lines", () => {
      // This is intentional for burst study patterns - if you haven't
      // reviewed something in 2 months, you've probably forgotten it
      const moderatelyWeak = makeStats({
        estimatedSuccessRate: 0.4,
        daysSinceLastAttempt: 1,
      });
      const veryStale = makeStats({
        estimatedSuccessRate: 0.8,
        daysSinceLastAttempt: 60,
      });

      expect(calculateReviewPriority(veryStale, TEST_DATE)).toBeGreaterThan(
        calculateReviewPriority(moderatelyWeak, TEST_DATE),
      );
    });
  });
});

// =============================================================================
// getStats
// =============================================================================

describe("getStats", () => {
  it("returns empty map for empty attempts array", () => {
    expect(getStats([], TEST_DATE).size).toBe(0);
  });

  describe("grouping", () => {
    it("groups attempts by lineId", () => {
      const attempts = [
        makeAttempt({ lineId: "line1", correct: true }),
        makeAttempt({ lineId: "line2", correct: false }),
      ];

      const result = getStats(attempts, TEST_DATE);

      expect(result.size).toBe(2);
      expect(result.has("line1")).toBe(true);
      expect(result.has("line2")).toBe(true);
    });

    it("preserves study and chapter name from first attempt", () => {
      const attempts = [
        makeAttempt({
          studyName: "My Study",
          chapterName: "Chapter 1",
          lineId: "line1",
          correct: true,
        }),
      ];

      const stats = getStats(attempts, TEST_DATE).get("line1");

      expect(stats?.study).toBe("My Study");
      expect(stats?.chapter).toBe("Chapter 1");
      expect(stats?.lineId).toBe("line1");
    });
  });

  describe("counting", () => {
    it("correctly counts attempts, correct, and wrong", () => {
      const attempts = [
        makeAttempt({ correct: true, timestamp: new Date("2024-01-01") }),
        makeAttempt({ correct: true, timestamp: new Date("2024-01-02") }),
        makeAttempt({ correct: false, timestamp: new Date("2024-01-03") }),
      ];

      const stats = getStats(attempts, TEST_DATE).get("line1");

      expect(stats?.numAttempts).toBe(3);
      expect(stats?.numCorrect).toBe(2);
      expect(stats?.numWrong).toBe(1);
    });
  });

  describe("derived statistics", () => {
    it("calculates rawSuccessRate as numCorrect/numAttempts", () => {
      const attempts = [
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: false }),
      ];

      const stats = getStats(attempts, TEST_DATE).get("line1");

      expect(stats?.rawSuccessRate).toBeCloseTo(2 / 3, 5);
    });

    it("calculates daysSinceLastAttempt from latest attempt", () => {
      const fiveDaysAgo = new Date(TEST_DATE.getTime() - 5 * ONE_DAY_MS);
      const attempts = [
        makeAttempt({
          correct: true,
          timestamp: new Date(TEST_DATE.getTime() - 10 * ONE_DAY_MS),
        }),
        makeAttempt({ correct: true, timestamp: fiveDaysAgo }),
      ];

      const stats = getStats(attempts, TEST_DATE).get("line1");

      expect(stats?.daysSinceLastAttempt).toBe(5);
    });

    it("calculates estimatedSuccessRate using time-weighted probability", () => {
      const attempts = [
        makeAttempt({ correct: true, timestamp: TEST_DATE }),
        makeAttempt({ correct: true, timestamp: TEST_DATE }),
      ];

      const stats = getStats(attempts, TEST_DATE).get("line1");

      // With 2 recent correct attempts, should be > 0.5
      expect(stats?.estimatedSuccessRate).toBeGreaterThan(0.5);
    });
  });

  describe("timestamp tracking", () => {
    it("tracks latest attempt timestamp regardless of order", () => {
      const latestDate = new Date("2024-01-15");
      const attempts = [
        makeAttempt({ correct: true, timestamp: new Date("2024-01-01") }),
        makeAttempt({ correct: false, timestamp: latestDate }),
        makeAttempt({ correct: true, timestamp: new Date("2024-01-05") }),
      ];

      const stats = getStats(attempts, TEST_DATE).get("line1");

      expect(stats?.latestAttempt).toEqual(latestDate);
    });

    it("tracks latest success timestamp", () => {
      const latestSuccess = new Date("2024-01-10");
      const attempts = [
        makeAttempt({ correct: true, timestamp: new Date("2024-01-01") }),
        makeAttempt({ correct: true, timestamp: latestSuccess }),
        makeAttempt({ correct: false, timestamp: new Date("2024-01-15") }),
      ];

      const stats = getStats(attempts, TEST_DATE).get("line1");

      expect(stats?.latestSuccess).toEqual(latestSuccess);
    });
  });
});
