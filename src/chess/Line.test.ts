import { WHITE, BLACK } from "chess.js";
import { Line, createLineId, getLineStatus, lineToSan } from "./Line";
import { Position } from "./Position";

describe("Line utilities", () => {
  const createMockPosition = (san: string | null): Position => ({
    fen: "mock-fen",
    lastMove: san
      ? {
          san,
          piece: "p",
          from: "e2",
          to: "e4",
          player: WHITE,
        }
      : null,
    comments: [],
    isGameOver: false,
  });

  const createMockLine = (positions: Position[], orientation = WHITE): Line => ({
    studyName: "Test Study",
    chapterName: "Test Chapter",
    lineId: "test-line-id",
    orientation,
    positions,
  });

  describe("createLineId", () => {
    it("creates line ID from positions (excluding first position)", () => {
      const positions = [
        createMockPosition(null),
        createMockPosition("e4"),
        createMockPosition("e5"),
        createMockPosition("Nf3"),
      ];

      expect(createLineId(positions)).toBe("e4 e5 Nf3");
    });

    it("returns empty string for single position (starting position only)", () => {
      const positions = [createMockPosition(null)];

      expect(createLineId(positions)).toBe("");
    });

    it("handles positions with no lastMove gracefully", () => {
      const positions = [
        createMockPosition(null),
        createMockPosition("e4"),
        createMockPosition(null),
        createMockPosition("Nf3"),
      ];

      expect(createLineId(positions)).toBe("e4  Nf3");
    });
  });

  describe("getLineStatus", () => {
    it("returns LINE_COMPLETE when at the last position", () => {
      const positions = [
        createMockPosition(null),
        createMockPosition("e4"),
        createMockPosition("e5"),
      ];
      const line = createMockLine(positions);

      expect(getLineStatus(line, 2)).toBe("LINE_COMPLETE");
    });

    it("returns WHITE_TO_MOVE for even indices (not at end)", () => {
      const positions = [
        createMockPosition(null),
        createMockPosition("e4"),
        createMockPosition("e5"),
        createMockPosition("Nf3"),
      ];
      const line = createMockLine(positions);

      expect(getLineStatus(line, 0)).toBe("WHITE_TO_MOVE");
      expect(getLineStatus(line, 2)).toBe("WHITE_TO_MOVE");
    });

    it("returns BLACK_TO_MOVE for odd indices (not at end)", () => {
      const positions = [
        createMockPosition(null),
        createMockPosition("e4"),
        createMockPosition("e5"),
        createMockPosition("Nf3"),
        createMockPosition("Nc6"),
      ];
      const line = createMockLine(positions);

      expect(getLineStatus(line, 1)).toBe("BLACK_TO_MOVE");
      expect(getLineStatus(line, 3)).toBe("BLACK_TO_MOVE");
    });

    it("returns LINE_COMPLETE even for single-position line", () => {
      const positions = [createMockPosition(null)];
      const line = createMockLine(positions);

      expect(getLineStatus(line, 0)).toBe("LINE_COMPLETE");
    });
  });

  describe("lineToSan", () => {
    it("converts line positions to SAN moves", () => {
      const positions = [
        createMockPosition(null),
        createMockPosition("e4"),
        createMockPosition("e5"),
        createMockPosition("Nf3"),
      ];
      const line = createMockLine(positions);

      expect(lineToSan(line)).toEqual(["e4", "e5", "Nf3"]);
    });

    it("returns empty array for line with only starting position", () => {
      const positions = [createMockPosition(null)];
      const line = createMockLine(positions);

      expect(lineToSan(line)).toEqual([]);
    });

    it("filters out positions without moves", () => {
      const positions = [
        createMockPosition(null),
        createMockPosition("e4"),
        createMockPosition(null),
        createMockPosition("Nf3"),
      ];
      const line = createMockLine(positions);

      expect(lineToSan(line)).toEqual(["e4", "Nf3"]);
    });
  });
});
