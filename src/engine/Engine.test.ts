import { Engine } from "./Engine";

describe("Engine", () => {
  describe("buildEvaluationFromInfo", () => {
    it("returns positive score for white", () => {
      expect(
        Engine.buildEvaluationFromInfo(
          { type: "INFO", score: { cp: 50 }, depth: 14, pv: [] },
          "w",
        ),
      ).toEqual({
        depth: 14,
        score: 50,
      });
    });

    it("returns negative score for white", () => {
      expect(
        Engine.buildEvaluationFromInfo(
          { type: "INFO", score: { cp: -50 }, depth: 14, pv: [] },
          "w",
        ),
      ).toEqual({
        depth: 14,
        score: -50,
      });
    });

    it("inverts positive score for black", () => {
      expect(
        Engine.buildEvaluationFromInfo(
          { type: "INFO", score: { cp: 10 }, depth: 14, pv: [] },
          "b",
        ),
      ).toEqual({
        depth: 14,
        score: -10,
      });
    });

    it("inverts negative score for black", () => {
      expect(
        Engine.buildEvaluationFromInfo(
          { type: "INFO", score: { cp: -15 }, depth: 14, pv: [] },
          "b",
        ),
      ).toEqual({
        depth: 14,
        score: 15,
      });
    });

    it("returns forced mate for player on positive mate", () => {
      expect(
        Engine.buildEvaluationFromInfo(
          { type: "INFO", score: { mate: 5 }, depth: 14, pv: [] },
          "w",
        ),
      ).toEqual({
        depth: 14,
        forced_mate: { in: 5, for: "PLAYER" },
      });
    });

    it("returns forced mate for opponent on negative mate", () => {
      expect(
        Engine.buildEvaluationFromInfo(
          { type: "INFO", score: { mate: -10 }, depth: 14, pv: [] },
          "w",
        ),
      ).toEqual({
        depth: 14,
        forced_mate: { in: 10, for: "OPPONENT" },
      });
    });
  });

  describe("buildMoveAndEvaluationFromInfo", () => {
    it("extracts move and evaluation from pv with mate", () => {
      expect(
        Engine.buildMoveAndEvaluationFromInfo(
          {
            type: "INFO",
            pv: ["d8c8", "g1h2", "c6d8", "g2g4"],
            score: { mate: -10 },
            depth: 14,
          },
          "w",
        ),
      ).toEqual({
        move: { color: "w", from: "d8", to: "c8" },
        evaluation: {
          depth: 14,
          forced_mate: { in: 10, for: "OPPONENT" },
        },
      });
    });

    it("extracts move with promotion from pv", () => {
      expect(
        Engine.buildMoveAndEvaluationFromInfo(
          {
            type: "INFO",
            pv: ["e7e8q", "g1h2", "c6d8", "g2g4"],
            score: { mate: -10 },
            depth: 14,
          },
          "w",
        ),
      ).toEqual({
        move: { color: "w", from: "e7", to: "e8", promotion: "q" },
        evaluation: {
          depth: 14,
          forced_mate: { in: 10, for: "OPPONENT" },
        },
      });
    });
  });

  describe("selectBestMoves", () => {
    it("sorts score moves before forced mate moves", () => {
      expect(
        Engine.selectBestMoves("w", [
          {
            move: { color: "w", from: "e7", to: "e8", promotion: "q" },
            evaluation: { depth: 14, forced_mate: { in: 10, for: "OPPONENT" } },
          },
          {
            move: { color: "w", from: "e3", to: "e4" },
            evaluation: { depth: 14, score: 200 },
          },
        ]),
      ).toEqual([
        {
          move: { color: "w", from: "e3", to: "e4" },
          evaluation: { depth: 14, score: 200 },
        },
        {
          move: { color: "w", from: "e7", to: "e8", promotion: "q" },
          evaluation: { depth: 14, forced_mate: { in: 10, for: "OPPONENT" } },
        },
      ]);
    });

    it("sorts by score ascending for black (lower is better)", () => {
      expect(
        Engine.selectBestMoves("b", [
          {
            move: { from: "e5", to: "e6", color: "b" },
            evaluation: { depth: 14, score: 100 },
          },
          {
            move: { from: "e5", to: "e7", color: "b" },
            evaluation: { depth: 14, score: -200 },
          },
          {
            move: { from: "e5", to: "e8", color: "b" },
            evaluation: { depth: 14, score: 350 },
          },
        ]),
      ).toEqual([
        {
          move: { from: "e5", to: "e7", color: "b" },
          evaluation: { depth: 14, score: -200 },
        },
        {
          move: { from: "e5", to: "e6", color: "b" },
          evaluation: { depth: 14, score: 100 },
        },
        {
          move: { from: "e5", to: "e8", color: "b" },
          evaluation: { depth: 14, score: 350 },
        },
      ]);
    });

    it("sorts by score descending for white (higher is better)", () => {
      expect(
        Engine.selectBestMoves("w", [
          {
            move: { from: "e5", to: "e6", color: "b" },
            evaluation: { depth: 14, score: 100 },
          },
          {
            move: { from: "e5", to: "e7", color: "b" },
            evaluation: { depth: 14, score: -200 },
          },
          {
            move: { from: "e5", to: "e8", color: "b" },
            evaluation: { depth: 14, score: 350 },
          },
        ]),
      ).toEqual([
        {
          move: { from: "e5", to: "e8", color: "b" },
          evaluation: { depth: 14, score: 350 },
        },
        {
          move: { from: "e5", to: "e6", color: "b" },
          evaluation: { depth: 14, score: 100 },
        },
        {
          move: { from: "e5", to: "e7", color: "b" },
          evaluation: { depth: 14, score: -200 },
        },
      ]);
    });

    it("selects moves from highest depth only", () => {
      expect(
        Engine.selectBestMoves("w", [
          {
            move: { from: "e1", to: "e2", color: "w" },
            evaluation: { depth: 5, score: 100 },
          },
          {
            move: { from: "e1", to: "e3", color: "w" },
            evaluation: { depth: 5, score: -200 },
          },
          {
            move: { from: "e1", to: "e4", color: "w" },
            evaluation: { depth: 15, score: -100 },
          },
          {
            move: { from: "e1", to: "e5", color: "w" },
            evaluation: { depth: 15, score: -300 },
          },
          {
            move: { from: "e1", to: "e6", color: "w" },
            evaluation: { depth: 15, score: -250 },
          },
          {
            move: { from: "e1", to: "e7", color: "w" },
            evaluation: { depth: 10, score: 500 },
          },
          {
            move: { from: "e1", to: "e8", color: "w" },
            evaluation: { depth: 10, score: 400 },
          },
        ]),
      ).toEqual([
        {
          move: { from: "e1", to: "e4", color: "w" },
          evaluation: { depth: 15, score: -100 },
        },
        {
          move: { from: "e1", to: "e6", color: "w" },
          evaluation: { depth: 15, score: -250 },
        },
        {
          move: { from: "e1", to: "e5", color: "w" },
          evaluation: { depth: 15, score: -300 },
        },
      ]);
    });

    it("prefers score over forced mate for opponent", () => {
      expect(
        Engine.selectBestMoves("w", [
          {
            move: { from: "e1", to: "e2", color: "w" },
            evaluation: { depth: 14, forced_mate: { in: 10, for: "OPPONENT" } },
          },
          {
            move: { from: "e1", to: "e3", color: "w" },
            evaluation: { depth: 14, score: 200 },
          },
        ]),
      ).toEqual([
        {
          move: { from: "e1", to: "e3", color: "w" },
          evaluation: { depth: 14, score: 200 },
        },
        {
          move: { from: "e1", to: "e2", color: "w" },
          evaluation: { depth: 14, forced_mate: { in: 10, for: "OPPONENT" } },
        },
      ]);
    });

    it("sorts forced mates by moves to mate and side", () => {
      expect(
        Engine.selectBestMoves("w", [
          {
            move: { from: "e1", to: "e2", color: "w" },
            evaluation: { depth: 14, forced_mate: { in: 10, for: "OPPONENT" } },
          },
          {
            move: { from: "e1", to: "e3", color: "w" },
            evaluation: { depth: 14, forced_mate: { in: 10, for: "PLAYER" } },
          },
          {
            move: { from: "e1", to: "e4", color: "w" },
            evaluation: { depth: 14, forced_mate: { in: 5, for: "OPPONENT" } },
          },
          {
            move: { from: "e1", to: "e5", color: "w" },
            evaluation: { depth: 14, forced_mate: { in: 5, for: "PLAYER" } },
          },
        ]),
      ).toEqual([
        {
          move: { from: "e1", to: "e5", color: "w" },
          evaluation: { depth: 14, forced_mate: { in: 5, for: "PLAYER" } },
        },
        {
          move: { from: "e1", to: "e3", color: "w" },
          evaluation: { depth: 14, forced_mate: { in: 10, for: "PLAYER" } },
        },
        {
          move: { from: "e1", to: "e2", color: "w" },
          evaluation: { depth: 14, forced_mate: { in: 10, for: "OPPONENT" } },
        },
        {
          move: { from: "e1", to: "e4", color: "w" },
          evaluation: { depth: 14, forced_mate: { in: 5, for: "OPPONENT" } },
        },
      ]);
    });
  });
});
