import { Engine } from "./Engine";

test("buildEvaluationFromInfo white score positive", () => {
  expect(
    Engine.buildEvaluationFromInfo(
      { type: "INFO", score: { cp: 50 }, depth: 14, pv: [] },
      "w",
    ),
  ).toStrictEqual({
    depth: 14,
    score: 50,
  });
});

test("buildEvaluationFromInfo white score negative", () => {
  expect(
    Engine.buildEvaluationFromInfo(
      { type: "INFO", score: { cp: -50 }, depth: 14, pv: [] },
      "w",
    ),
  ).toStrictEqual({
    depth: 14,
    score: -50,
  });
});

test("buildEvaluationFromInfo black score positive", () => {
  expect(
    Engine.buildEvaluationFromInfo(
      { type: "INFO", score: { cp: 10 }, depth: 14, pv: [] },
      "b",
    ),
  ).toStrictEqual({
    depth: 14,
    score: -10,
  });
});

test("buildEvaluationFromInfo black score negative", () => {
  expect(
    Engine.buildEvaluationFromInfo(
      { type: "INFO", score: { cp: -15 }, depth: 14, pv: [] },
      "b",
    ),
  ).toStrictEqual({
    depth: 14,
    score: 15,
  });
});

test("buildEvaluationFromInfo mate positive", () => {
  expect(
    Engine.buildEvaluationFromInfo(
      { type: "INFO", score: { mate: 5 }, depth: 14, pv: [] },
      "w",
    ),
  ).toStrictEqual({
    depth: 14,
    forced_mate: { in: 5, for: "PLAYER" },
  });
});

test("buildEvaluationFromInfo mate negative", () => {
  expect(
    Engine.buildEvaluationFromInfo(
      { type: "INFO", score: { mate: -10 }, depth: 14, pv: [] },
      "w",
    ),
  ).toStrictEqual({
    depth: 14,
    forced_mate: { in: 10, for: "OPPONENT" },
  });
});

test("buildMoveAndEvaluationFromInfo pv mate", () => {
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
  ).toStrictEqual({
    move: { color: "w", from: "d8", to: "c8" },
    evaluation: {
      depth: 14,
      forced_mate: { in: 10, for: "OPPONENT" },
    },
  });
});

test("buildMoveAndEvaluationFromInfo pv promote", () => {
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
  ).toStrictEqual({
    move: { color: "w", from: "e7", to: "e8", promotion: "q" },
    evaluation: {
      depth: 14,
      forced_mate: { in: 10, for: "OPPONENT" },
    },
  });
});

test("selectBestMoves moves in output", () => {
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

test("selectBestMoves multiple scores black", () => {
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

test("selectBestMoves multiple scores white", () => {
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

test("selectBestMoves multiple scores multiple depths white", () => {
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

test("selectBestMoves score and forced_mate white", () => {
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

test("selectBestMoves multiple forced_mate black", () => {
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
