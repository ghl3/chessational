import { calculateProbability } from "./LineStats";

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
});
