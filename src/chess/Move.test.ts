import { WHITE, BLACK, Move as MoveResult } from "chess.js";
import {
  getOppositeColor,
  moveResultToMove,
  convertToPieceSymbol,
  getPromoteToPiece,
} from "./Move";

describe("Move utilities", () => {
  describe("getOppositeColor", () => {
    it("returns black when given white", () => {
      expect(getOppositeColor(WHITE)).toBe(BLACK);
    });

    it("returns white when given black", () => {
      expect(getOppositeColor(BLACK)).toBe(WHITE);
    });
  });

  describe("moveResultToMove", () => {
    it("converts a MoveResult to a Move", () => {
      const moveResult = {
        color: WHITE,
        from: "e2",
        to: "e4",
        piece: "p",
        san: "e4",
        flags: "b",
        lan: "e2e4",
        before: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        after: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      } as MoveResult;

      expect(moveResultToMove(moveResult)).toEqual({
        san: "e4",
        piece: "p",
        from: "e2",
        to: "e4",
        promotion: undefined,
        player: WHITE,
      });
    });

    it("handles promotion moves", () => {
      const moveResult = {
        color: WHITE,
        from: "e7",
        to: "e8",
        piece: "p",
        san: "e8=Q",
        flags: "p",
        lan: "e7e8q",
        promotion: "q",
        before: "4k3/4P3/8/8/8/8/8/4K3 w - - 0 1",
        after: "4Q3/8/8/8/8/8/8/4K3 b - - 0 1",
      } as MoveResult;

      expect(moveResultToMove(moveResult)).toEqual({
        san: "e8=Q",
        piece: "p",
        from: "e7",
        to: "e8",
        promotion: "q",
        player: WHITE,
      });
    });
  });

  describe("convertToPieceSymbol", () => {
    it("returns undefined for undefined input", () => {
      expect(convertToPieceSymbol(undefined)).toBeUndefined();
    });

    it.each([
      { input: "wQ", expected: "q" },
      { input: "bQ", expected: "q" },
      { input: "wR", expected: "r" },
      { input: "bR", expected: "r" },
      { input: "wB", expected: "b" },
      { input: "bB", expected: "b" },
      { input: "wN", expected: "n" },
      { input: "bN", expected: "n" },
      { input: "wK", expected: "k" },
      { input: "bK", expected: "k" },
      { input: "wP", expected: "p" },
      { input: "bP", expected: "p" },
    ])("converts $input to $expected", ({ input, expected }) => {
      expect(convertToPieceSymbol(input)).toBe(expected);
    });

    it("throws error for unknown piece", () => {
      expect(() => convertToPieceSymbol("unknown")).toThrow("Unknown piece: unknown");
    });

    it("throws error for null input", () => {
      expect(() => convertToPieceSymbol(null)).toThrow("Unknown piece: null");
    });
  });

  describe("getPromoteToPiece", () => {
    it("returns promotion piece for white pawn promoting", () => {
      expect(getPromoteToPiece("e7", "e8", "p", "q")).toBe("q");
    });

    it("returns promotion piece for white pawn capturing and promoting", () => {
      expect(getPromoteToPiece("e7", "d8", "p", "r")).toBe("r");
    });

    it("returns promotion piece for black pawn promoting", () => {
      expect(getPromoteToPiece("a2", "a1", "p", "n")).toBe("n");
    });

    it("returns promotion piece for black pawn capturing and promoting", () => {
      expect(getPromoteToPiece("b2", "c1", "p", "b")).toBe("b");
    });

    it("throws error when promotion piece not specified for promotion move", () => {
      expect(() => getPromoteToPiece("e7", "e8", "p", undefined)).toThrow(
        "Must specify promotedToPiece"
      );
    });

    it("returns undefined for non-promotion pawn move", () => {
      expect(getPromoteToPiece("e2", "e4", "p", undefined)).toBeUndefined();
    });

    it("returns undefined for piece that cannot promote", () => {
      expect(getPromoteToPiece("e1", "e2", "k", undefined)).toBeUndefined();
    });

    it("returns undefined for pawn not on promotion rank", () => {
      expect(getPromoteToPiece("e6", "e7", "p", undefined)).toBeUndefined();
    });
  });
});
