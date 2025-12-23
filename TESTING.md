# Unit Test Style Guide

This document captures the conventions for writing unit tests in this codebase.

## Structure

Use `describe()` with nested `it()` blocks. Never use standalone `test()`.

```typescript
describe("functionName", () => {
  describe("category of behavior", () => {
    it("expected behavior as direct statement", () => {
      // test code
    });
  });
});
```

## Naming

Use direct statements, not "should" prefixes:

```typescript
// Good
it("returns null for empty array", () => { ... });
it("throws error when input is invalid", () => { ... });

// Avoid
it("should return null for empty array", () => { ... });
```

## Assertions

- `toBe` for primitives (strings, numbers, booleans)
- `toEqual` for objects and arrays

```typescript
expect(result).toBe(42);
expect(result).toBe("hello");
expect(result).toBe(true);

expect(result).toEqual({ name: "test", value: 1 });
expect(result).toEqual([1, 2, 3]);
```

## Self-Contained Tests

Each test should be independent and contain all its own data. Avoid shared constants that couple tests together.

```typescript
// Good - all data visible in the test
it("calculates priority for stale items", () => {
  const now = new Date("2024-06-15");
  const monthAgo = new Date("2024-05-15");
  const item = {
    name: "test",
    lastAccessed: monthAgo,
  };

  const priority = calculatePriority(item, now);

  expect(priority).toBeGreaterThan(0.5);
});

// Avoid - hidden coupling via shared constants
const TEST_DATE = new Date("2024-06-15");
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

it("calculates priority for stale items", () => {
  const item = {
    name: "test",
    lastAccessed: new Date(TEST_DATE.getTime() - ONE_MONTH_MS),
  };

  const priority = calculatePriority(item, TEST_DATE);

  expect(priority).toBeGreaterThan(0.5);
});
```

## Inline Objects vs Helpers

The goal is clarity. Choose the approach that best highlights what the test is about.

**Use inline objects** when:
- The object is simple (few fields)
- Most fields are relevant to understanding the test

**Use helpers** when:
- Objects have many required fields but only a few matter for the test
- The helper emphasizes the differences between test cases

```typescript
// Good - helper emphasizes what matters (estimatedSuccessRate)
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

it("low knowledge lines have higher priority", () => {
  expect(
    calculateReviewPriority(makeStats({ estimatedSuccessRate: 0.3 }), now),
  ).toBeGreaterThan(
    calculateReviewPriority(makeStats({ estimatedSuccessRate: 0.9 }), now),
  );
});

// Good - inline when all fields are relevant
it("processes the attempt", () => {
  const attempt = {
    studyName: "study1",
    chapterName: "chapter1",
    lineId: "line1",
    correct: true,
    timestamp: new Date("2024-06-15"),
  };

  expect(processAttempt(attempt).status).toBe("success");
});
```

## Parameterized Tests

Use `it.each` when you have 3 or more similar test cases:

```typescript
it.each([
  { input: "wQ", expected: "q" },
  { input: "bQ", expected: "q" },
  { input: "wR", expected: "r" },
  { input: "bR", expected: "r" },
  { input: "wN", expected: "n" },
  { input: "bN", expected: "n" },
])("converts $input to $expected", ({ input, expected }) => {
  expect(convertPiece(input)).toBe(expected);
});
```

## Inline Simple Assertions

For simple function calls, inline them directly in the assertion rather than creating a temporary variable:

```typescript
// Good - simple function call inlined
it("tokenizes pawn moves", () => {
  expect(tokenizeQuery("e4 d5")).toEqual([
    { token: "e4", type: "move" },
    { token: "d5", type: "move" },
  ]);
});

// Avoid unnecessary temp variable for simple cases
it("tokenizes pawn moves", () => {
  const result = tokenizeQuery("e4 d5");

  expect(result).toEqual([
    { token: "e4", type: "move" },
    { token: "d5", type: "move" },
  ]);
});
```

Use a result variable when:
- You need multiple assertions on the same result
- The setup is complex and benefits from visual separation
- The function call itself is complex or has many arguments

## Clear Structure

Separate setup, action, and assertion with blank lines when there is meaningful setup. No comments needed if the code is clear.

```typescript
// Complex setup benefits from separation
it("finds the highest priority line", () => {
  const lines = [
    { id: "a", score: 10 },
    { id: "b", score: 50 },
    { id: "c", score: 30 },
  ];

  const result = findHighestPriority(lines);

  expect(result.id).toBe("b");
  expect(result.score).toBe(50);
});
```

