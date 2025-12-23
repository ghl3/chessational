import {
  calculateProbability,
  calculateReviewPriority,
  daysBetween,
  DEFAULT_HALFLIFE_DAYS,
  getStats,
  LineStats,
} from "./LineStats";
import { Attempt } from "../chess/Attempt";

const makeStats = (overrides: Partial<LineStats> = {}): LineStats => ({
  study: "study1",
  chapter: "chapter1",
  lineId: "line1",
  numAttempts: 1,
  numCorrect: 1,
  numWrong: 0,
  latestAttempt: new Date("2024-06-15"),
  latestSuccess: new Date("2024-06-15"),
  rawSuccessRate: 1,
  estimatedSuccessRate: 0.75,
  daysSinceLastAttempt: 0,
  ...overrides,
});

describe("daysBetween", () => {
  it("returns 0 for same date", () => {
    const date = new Date("2024-06-15T12:00:00Z");
    expect(daysBetween(date, date)).toBe(0);
  });

  it("returns correct days for dates in order", () => {
    expect(daysBetween(new Date("2024-01-01"), new Date("2024-01-08"))).toBe(7);
  });

  it("returns absolute value regardless of order", () => {
    expect(daysBetween(new Date("2024-01-08"), new Date("2024-01-01"))).toBe(7);
  });

  it("handles fractional days", () => {
    expect(
      daysBetween(new Date("2024-01-01T00:00:00Z"), new Date("2024-01-01T12:00:00Z")),
    ).toBe(0.5);
  });
});

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
      const now = new Date("2024-06-15T12:00:00Z");
      const attempts: Attempt[] = [
        { studyName: "s", chapterName: "c", lineId: "l", correct: false, timestamp: now },
        { studyName: "s", chapterName: "c", lineId: "l", correct: true, timestamp: now },
        { studyName: "s", chapterName: "c", lineId: "l", correct: true, timestamp: now },
      ];

      expect(calculateProbability(attempts)).toBeGreaterThan(0.5);
    });

    it("returns lower probability for mostly incorrect attempts", () => {
      const now = new Date("2024-06-15T12:00:00Z");
      const attempts: Attempt[] = [
        { studyName: "s", chapterName: "c", lineId: "l", correct: true, timestamp: now },
        { studyName: "s", chapterName: "c", lineId: "l", correct: false, timestamp: now },
        { studyName: "s", chapterName: "c", lineId: "l", correct: false, timestamp: now },
      ];

      expect(calculateProbability(attempts)).toBeLessThan(0.5);
    });
  });

  describe("time weighting", () => {
    it("weighs recent attempts more heavily than old ones", () => {
      const now = new Date("2024-06-15T12:00:00Z");
      const monthAgo = new Date("2024-05-15T12:00:00Z");

      const attemptsRecentWrong: Attempt[] = [
        { studyName: "s", chapterName: "c", lineId: "l", correct: true, timestamp: monthAgo },
        { studyName: "s", chapterName: "c", lineId: "l", correct: false, timestamp: now },
      ];
      const attemptsRecentCorrect: Attempt[] = [
        { studyName: "s", chapterName: "c", lineId: "l", correct: false, timestamp: monthAgo },
        { studyName: "s", chapterName: "c", lineId: "l", correct: true, timestamp: now },
      ];

      expect(calculateProbability(attemptsRecentCorrect, 0.5, now)).toBeGreaterThan(
        calculateProbability(attemptsRecentWrong, 0.5, now),
      );
    });

    it("shorter half-life causes faster decay of old attempts", () => {
      const now = new Date("2024-06-15T12:00:00Z");
      const weekAgo = new Date("2024-06-08T12:00:00Z");
      const attempts: Attempt[] = [
        { studyName: "s", chapterName: "c", lineId: "l", correct: true, timestamp: weekAgo },
      ];

      const probShortHalflife = calculateProbability(attempts, 0.5, now, 7);
      const probLongHalflife = calculateProbability(attempts, 0.5, now, 28);

      expect(Math.abs(probShortHalflife - 0.5)).toBeLessThan(
        Math.abs(probLongHalflife - 0.5),
      );
    });
  });
});

describe("calculateReviewPriority", () => {
  describe("unpracticed lines", () => {
    it("returns 1.0 for null stats", () => {
      expect(calculateReviewPriority(null, new Date("2024-06-15"))).toBe(1.0);
    });

    it("returns 1.0 for stats with zero attempts", () => {
      expect(
        calculateReviewPriority(makeStats({ numAttempts: 0 }), new Date("2024-06-15")),
      ).toBe(1.0);
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
        const now = new Date("2024-06-15");
        const priority = calculateReviewPriority(
          makeStats({ estimatedSuccessRate: knowledge, daysSinceLastAttempt: 0 }),
          now,
        );

        expect(priority).toBeGreaterThanOrEqual(expectedPriorityRange[0]);
        expect(priority).toBeLessThanOrEqual(expectedPriorityRange[1]);
      },
    );

    it("low knowledge lines have higher priority than high knowledge", () => {
      const now = new Date("2024-06-15");

      expect(
        calculateReviewPriority(makeStats({ estimatedSuccessRate: 0.3 }), now),
      ).toBeGreaterThan(
        calculateReviewPriority(makeStats({ estimatedSuccessRate: 0.9 }), now),
      );
    });
  });

  describe("staleness factor", () => {
    it("stale lines have higher priority than recently reviewed", () => {
      const now = new Date("2024-06-15");

      expect(
        calculateReviewPriority(makeStats({ daysSinceLastAttempt: 30 }), now),
      ).toBeGreaterThan(
        calculateReviewPriority(makeStats({ daysSinceLastAttempt: 1 }), now),
      );
    });

    it("staleness is capped at 3x half-life", () => {
      const now = new Date("2024-06-15");

      expect(
        calculateReviewPriority(makeStats({ daysSinceLastAttempt: 200 }), now),
      ).toBeCloseTo(
        calculateReviewPriority(makeStats({ daysSinceLastAttempt: 3 * DEFAULT_HALFLIFE_DAYS }), now),
        5,
      );
    });

    it("stalenessWeight parameter controls staleness contribution", () => {
      const now = new Date("2024-06-15");
      const stale = makeStats({ daysSinceLastAttempt: 28 });

      expect(
        calculateReviewPriority(stale, now, DEFAULT_HALFLIFE_DAYS, 0.5),
      ).toBeGreaterThan(
        calculateReviewPriority(stale, now, DEFAULT_HALFLIFE_DAYS, 0.1),
      );
    });
  });

  describe("knowledge vs staleness trade-offs (burst study behavior)", () => {
    it("very weak lines beat moderately stale lines", () => {
      const now = new Date("2024-06-15");

      expect(
        calculateReviewPriority(
          makeStats({ estimatedSuccessRate: 0.15, daysSinceLastAttempt: 1 }),
          now,
        ),
      ).toBeGreaterThan(
        calculateReviewPriority(
          makeStats({ estimatedSuccessRate: 0.85, daysSinceLastAttempt: 28 }),
          now,
        ),
      );
    });

    it("very stale lines can overtake moderately weak lines", () => {
      const now = new Date("2024-06-15");

      expect(
        calculateReviewPriority(
          makeStats({ estimatedSuccessRate: 0.8, daysSinceLastAttempt: 60 }),
          now,
        ),
      ).toBeGreaterThan(
        calculateReviewPriority(
          makeStats({ estimatedSuccessRate: 0.4, daysSinceLastAttempt: 1 }),
          now,
        ),
      );
    });
  });
});

describe("getStats", () => {
  it("returns empty map for empty attempts array", () => {
    expect(getStats([], new Date("2024-06-15")).size).toBe(0);
  });

  describe("grouping", () => {
    it("groups attempts by lineId", () => {
      const now = new Date("2024-06-15");
      const attempts: Attempt[] = [
        { studyName: "s", chapterName: "c", lineId: "line1", correct: true, timestamp: now },
        { studyName: "s", chapterName: "c", lineId: "line2", correct: false, timestamp: now },
      ];

      const result = getStats(attempts, now);

      expect(result.size).toBe(2);
      expect(result.has("line1")).toBe(true);
      expect(result.has("line2")).toBe(true);
    });

    it("preserves study and chapter name from first attempt", () => {
      const now = new Date("2024-06-15");
      const attempts: Attempt[] = [
        { studyName: "My Study", chapterName: "Chapter 1", lineId: "line1", correct: true, timestamp: now },
      ];

      const stats = getStats(attempts, now).get("line1");

      expect(stats?.study).toBe("My Study");
      expect(stats?.chapter).toBe("Chapter 1");
      expect(stats?.lineId).toBe("line1");
    });
  });

  describe("counting", () => {
    it("correctly counts attempts, correct, and wrong", () => {
      const attempts: Attempt[] = [
        { studyName: "s", chapterName: "c", lineId: "line1", correct: true, timestamp: new Date("2024-01-01") },
        { studyName: "s", chapterName: "c", lineId: "line1", correct: true, timestamp: new Date("2024-01-02") },
        { studyName: "s", chapterName: "c", lineId: "line1", correct: false, timestamp: new Date("2024-01-03") },
      ];

      const stats = getStats(attempts, new Date("2024-06-15")).get("line1");

      expect(stats?.numAttempts).toBe(3);
      expect(stats?.numCorrect).toBe(2);
      expect(stats?.numWrong).toBe(1);
    });
  });

  describe("derived statistics", () => {
    it("calculates rawSuccessRate as numCorrect/numAttempts", () => {
      const now = new Date("2024-06-15");
      const attempts: Attempt[] = [
        { studyName: "s", chapterName: "c", lineId: "line1", correct: true, timestamp: now },
        { studyName: "s", chapterName: "c", lineId: "line1", correct: true, timestamp: now },
        { studyName: "s", chapterName: "c", lineId: "line1", correct: false, timestamp: now },
      ];

      expect(getStats(attempts, now).get("line1")?.rawSuccessRate).toBeCloseTo(2 / 3, 5);
    });

    it("calculates daysSinceLastAttempt from latest attempt", () => {
      const now = new Date("2024-06-15T12:00:00Z");
      const attempts: Attempt[] = [
        { studyName: "s", chapterName: "c", lineId: "line1", correct: true, timestamp: new Date("2024-06-05T12:00:00Z") },
        { studyName: "s", chapterName: "c", lineId: "line1", correct: true, timestamp: new Date("2024-06-10T12:00:00Z") },
      ];

      expect(getStats(attempts, now).get("line1")?.daysSinceLastAttempt).toBe(5);
    });

    it("calculates estimatedSuccessRate using time-weighted probability", () => {
      const now = new Date("2024-06-15T12:00:00Z");
      const attempts: Attempt[] = [
        { studyName: "s", chapterName: "c", lineId: "line1", correct: true, timestamp: now },
        { studyName: "s", chapterName: "c", lineId: "line1", correct: true, timestamp: now },
      ];

      expect(getStats(attempts, now).get("line1")?.estimatedSuccessRate).toBeGreaterThan(0.5);
    });
  });

  describe("timestamp tracking", () => {
    it("tracks latest attempt timestamp regardless of order", () => {
      const latestDate = new Date("2024-01-15");
      const attempts: Attempt[] = [
        { studyName: "s", chapterName: "c", lineId: "line1", correct: true, timestamp: new Date("2024-01-01") },
        { studyName: "s", chapterName: "c", lineId: "line1", correct: false, timestamp: latestDate },
        { studyName: "s", chapterName: "c", lineId: "line1", correct: true, timestamp: new Date("2024-01-05") },
      ];

      expect(getStats(attempts, new Date("2024-06-15")).get("line1")?.latestAttempt).toEqual(latestDate);
    });

    it("tracks latest success timestamp", () => {
      const latestSuccess = new Date("2024-01-10");
      const attempts: Attempt[] = [
        { studyName: "s", chapterName: "c", lineId: "line1", correct: true, timestamp: new Date("2024-01-01") },
        { studyName: "s", chapterName: "c", lineId: "line1", correct: true, timestamp: latestSuccess },
        { studyName: "s", chapterName: "c", lineId: "line1", correct: false, timestamp: new Date("2024-01-15") },
      ];

      expect(getStats(attempts, new Date("2024-06-15")).get("line1")?.latestSuccess).toEqual(latestSuccess);
    });
  });
});
