import { calculateProbability, getStats } from "./LineStats";
import { Attempt } from "../chess/Attempt";

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
    expect(calculateProbability(attempts)).toBe(0.5);
  });

  it("returns higher probability for recent correct attempts", () => {
    const attempts = [
      { ...baseAttempt, lineId: "line1", correct: false },
      { ...baseAttempt, lineId: "line1", correct: true },
      { ...baseAttempt, lineId: "line1", correct: true },
    ];
    expect(calculateProbability(attempts)).toBeGreaterThan(0.5);
  });

  it("handles cases with high confidence threshold", () => {
    const attempts = [
      { ...baseAttempt, lineId: "line1", correct: true },
      { ...baseAttempt, lineId: "line1", correct: true },
      { ...baseAttempt, lineId: "line1", correct: false },
    ];
    const highThreshold = 0.95;
    const result = calculateProbability(attempts, highThreshold);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("handles cases with low confidence threshold", () => {
    const attempts = [
      { ...baseAttempt, lineId: "line1", correct: false },
      { ...baseAttempt, lineId: "line1", correct: false },
      { ...baseAttempt, lineId: "line1", correct: true },
    ];
    const lowThreshold = 0.85;
    const result = calculateProbability(attempts, lowThreshold);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("returns default probability for empty attempts array", () => {
    expect(calculateProbability([])).toBe(0.5);
  });

  it("returns custom default probability when specified", () => {
    expect(calculateProbability([], 0.7)).toBe(0.7);
  });
});

describe("getStats", () => {
  it("returns empty map for empty attempts array", () => {
    const result = getStats([]);
    expect(result.size).toBe(0);
  });

  it("groups attempts by lineId", () => {
    const attempts: Attempt[] = [
      {
        studyName: "study1",
        chapterName: "chapter1",
        lineId: "line1",
        timestamp: new Date("2024-01-01"),
        correct: true,
      },
      {
        studyName: "study1",
        chapterName: "chapter1",
        lineId: "line2",
        timestamp: new Date("2024-01-02"),
        correct: false,
      },
    ];

    const result = getStats(attempts);

    expect(result.size).toBe(2);
    expect(result.has("line1")).toBe(true);
    expect(result.has("line2")).toBe(true);
  });

  it("correctly counts attempts, correct, and wrong", () => {
    const attempts: Attempt[] = [
      {
        studyName: "study1",
        chapterName: "chapter1",
        lineId: "line1",
        timestamp: new Date("2024-01-01"),
        correct: true,
      },
      {
        studyName: "study1",
        chapterName: "chapter1",
        lineId: "line1",
        timestamp: new Date("2024-01-02"),
        correct: true,
      },
      {
        studyName: "study1",
        chapterName: "chapter1",
        lineId: "line1",
        timestamp: new Date("2024-01-03"),
        correct: false,
      },
    ];

    const result = getStats(attempts);
    const stats = result.get("line1");

    expect(stats).toBeDefined();
    expect(stats?.numAttempts).toBe(3);
    expect(stats?.numCorrect).toBe(2);
    expect(stats?.numWrong).toBe(1);
  });

  it("tracks latest attempt timestamp", () => {
    const latestDate = new Date("2024-01-15");
    const attempts: Attempt[] = [
      {
        studyName: "study1",
        chapterName: "chapter1",
        lineId: "line1",
        timestamp: new Date("2024-01-01"),
        correct: true,
      },
      {
        studyName: "study1",
        chapterName: "chapter1",
        lineId: "line1",
        timestamp: latestDate,
        correct: false,
      },
      {
        studyName: "study1",
        chapterName: "chapter1",
        lineId: "line1",
        timestamp: new Date("2024-01-05"),
        correct: true,
      },
    ];

    const result = getStats(attempts);
    const stats = result.get("line1");

    expect(stats?.latestAttempt).toEqual(latestDate);
  });

  it("tracks latest success timestamp", () => {
    const latestSuccess = new Date("2024-01-10");
    const attempts: Attempt[] = [
      {
        studyName: "study1",
        chapterName: "chapter1",
        lineId: "line1",
        timestamp: new Date("2024-01-01"),
        correct: true,
      },
      {
        studyName: "study1",
        chapterName: "chapter1",
        lineId: "line1",
        timestamp: latestSuccess,
        correct: true,
      },
      {
        studyName: "study1",
        chapterName: "chapter1",
        lineId: "line1",
        timestamp: new Date("2024-01-15"),
        correct: false,
      },
    ];

    const result = getStats(attempts);
    const stats = result.get("line1");

    // Note: latestSuccess is updated each time a correct attempt is seen
    // Since attempts are processed in order, it will be the last correct one processed
    expect(stats?.latestSuccess).toEqual(latestSuccess);
  });

  it("preserves study and chapter name from first attempt", () => {
    const attempts: Attempt[] = [
      {
        studyName: "My Study",
        chapterName: "Chapter 1",
        lineId: "line1",
        timestamp: new Date(),
        correct: true,
      },
    ];

    const result = getStats(attempts);
    const stats = result.get("line1");

    expect(stats?.study).toBe("My Study");
    expect(stats?.chapter).toBe("Chapter 1");
    expect(stats?.lineId).toBe("line1");
  });

  it("calculates estimated success rate", () => {
    const attempts: Attempt[] = [
      {
        studyName: "study1",
        chapterName: "chapter1",
        lineId: "line1",
        timestamp: new Date(),
        correct: true,
      },
      {
        studyName: "study1",
        chapterName: "chapter1",
        lineId: "line1",
        timestamp: new Date(),
        correct: true,
      },
    ];

    const result = getStats(attempts);
    const stats = result.get("line1");

    // With 2 correct attempts, success rate should be > 0.5
    expect(stats?.estimatedSuccessRate).toBeGreaterThan(0.5);
  });
});
