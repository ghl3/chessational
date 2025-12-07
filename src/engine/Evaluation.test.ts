import { EvaluationUtil, Evaluation } from "./Evaluation";

describe("EvaluationUtil", () => {
  describe("toScoreString", () => {
    it("should return '0.0' for zero score", () => {
      expect(EvaluationUtil.toScoreString(0)).toBe("0.0");
    });

    it("should return positive string with + prefix for positive score", () => {
      expect(EvaluationUtil.toScoreString(100)).toBe("+1");
      expect(EvaluationUtil.toScoreString(50)).toBe("+0.5");
      expect(EvaluationUtil.toScoreString(150)).toBe("+1.5");
    });

    it("should return negative string with - prefix for negative score", () => {
      expect(EvaluationUtil.toScoreString(-100)).toBe("-1");
      expect(EvaluationUtil.toScoreString(-50)).toBe("-0.5");
      expect(EvaluationUtil.toScoreString(-150)).toBe("-1.5");
    });

    it("should handle large scores", () => {
      expect(EvaluationUtil.toScoreString(1000)).toBe("+10");
      expect(EvaluationUtil.toScoreString(-2500)).toBe("-25");
    });

    it("should handle small fractional scores", () => {
      expect(EvaluationUtil.toScoreString(10)).toBe("+0.1");
      expect(EvaluationUtil.toScoreString(-5)).toBe("-0.05");
    });
  });

  describe("toEvalString", () => {
    it("should return score string when evaluation has score", () => {
      const evaluation: Evaluation = { score: 150, depth: 20 };
      expect(EvaluationUtil.toEvalString(evaluation)).toBe("+1.5");
    });

    it("should return score string for zero score", () => {
      const evaluation: Evaluation = { score: 0, depth: 20 };
      expect(EvaluationUtil.toEvalString(evaluation)).toBe("0.0");
    });

    it("should return score string for negative score", () => {
      const evaluation: Evaluation = { score: -200, depth: 15 };
      expect(EvaluationUtil.toEvalString(evaluation)).toBe("-2");
    });

    it("should return forced mate string for player", () => {
      const evaluation: Evaluation = {
        forced_mate: { in: 5, for: "PLAYER" },
        depth: 20,
      };
      expect(EvaluationUtil.toEvalString(evaluation)).toBe("Mate in 5 for PLAYER");
    });

    it("should return forced mate string for opponent", () => {
      const evaluation: Evaluation = {
        forced_mate: { in: 3, for: "OPPONENT" },
        depth: 20,
      };
      expect(EvaluationUtil.toEvalString(evaluation)).toBe("Mate in 3 for OPPONENT");
    });

    it("should return checkmate string for player wins", () => {
      const evaluation: Evaluation = {
        mate: { for: "PLAYER" },
        depth: 0,
      };
      expect(EvaluationUtil.toEvalString(evaluation)).toBe("Checkmate (PLAYER wins)");
    });

    it("should return checkmate string for opponent wins", () => {
      const evaluation: Evaluation = {
        mate: { for: "OPPONENT" },
        depth: 0,
      };
      expect(EvaluationUtil.toEvalString(evaluation)).toBe("Checkmate (OPPONENT wins)");
    });

    it("should throw error for invalid evaluation (no score, forced_mate, or mate)", () => {
      const evaluation: Evaluation = { depth: 20 };
      expect(() => EvaluationUtil.toEvalString(evaluation)).toThrow("Invalid Evaluation");
    });

    it("should prioritize score over forced_mate", () => {
      const evaluation: Evaluation = {
        score: 100,
        forced_mate: { in: 5, for: "PLAYER" },
        depth: 20,
      };
      expect(EvaluationUtil.toEvalString(evaluation)).toBe("+1");
    });

    it("should prioritize forced_mate over mate when no score", () => {
      const evaluation: Evaluation = {
        forced_mate: { in: 2, for: "PLAYER" },
        mate: { for: "PLAYER" },
        depth: 20,
      };
      expect(EvaluationUtil.toEvalString(evaluation)).toBe("Mate in 2 for PLAYER");
    });
  });
});
