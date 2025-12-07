import { WHITE, BLACK, Move as MoveResult } from "chess.js";
import {
  getOppositeColor,
  moveResultToMove,
  convertToPieceSymbol,
  getPromoteToPiece,
} from "./Move";

describe("Move utilities", () => {
  describe("getOppositeColor", () => {
    it("should return black when given white", () => {
      expect(getOppositeColor(WHITE)).toBe(BLACK);
    });

    it("should return white when given black", () => {
      expect(getOppositeColor(BLACK)).toBe(WHITE);
    });
  });

  describe("moveResultToMove", () => {
    it("should convert a MoveResult to a Move", () => {
      const moveResult: MoveResult = {
        color: WHITE,
        from: "e2",
        to: "e4",
        piece: "p",
        san: "e4",
        flags: "b",
        lan: "e2e4",
        before: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        after: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      };

      const result = moveResultToMove(moveResult);

      expect(result).toEqual({
        san: "e4",
        piece: "p",
        from: "e2",
        to: "e4",
        promotion: undefined,
        player: WHITE,
      });
    });

    it("should handle promotion moves", () => {
      const moveResult: MoveResult = {
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
      };

      const result = moveResultToMove(moveResult);

      expect(result).toEqual({
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
    it("should return undefined for undefined input", () => {
      expect(convertToPieceSymbol(undefined)).toBeUndefined();
    });

    it("should convert white queen", () => {
      expect(convertToPieceSymbol("wQ")).toBe("q");
    });

    it("should convert black queen", () => {
      expect(convertToPieceSymbol("bQ")).toBe("q");
    });

    it("should convert white rook", () => {
      expect(convertToPieceSymbol("wR")).toBe("r");
    });

    it("should convert black rook", () => {
      expect(convertToPieceSymbol("bR")).toBe("r");
    });

    it("should convert white bishop", () => {
      expect(convertToPieceSymbol("wB")).toBe("b");
    });

    it("should convert black bishop", () => {
      expect(convertToPieceSymbol("bB")).toBe("b");
    });

    it("should convert white knight", () => {
      expect(convertToPieceSymbol("wN")).toBe("n");
    });

    it("should convert black knight", () => {
      expect(convertToPieceSymbol("bN")).toBe("n");
    });

    it("should convert white king", () => {
      expect(convertToPieceSymbol("wK")).toBe("k");
    });

    it("should convert black king", () => {
      expect(convertToPieceSymbol("bK")).toBe("k");
    });

    it("should convert white pawn", () => {
      expect(convertToPieceSymbol("wP")).toBe("p");
    });

    it("should convert black pawn", () => {
      expect(convertToPieceSymbol("bP")).toBe("p");
    });

    it("should throw error for unknown piece", () => {
      expect(() => convertToPieceSymbol("unknown")).toThrow("Unknown piece: unknown");
    });

    it("should throw error for null input", () => {
      expect(() => convertToPieceSymbol(null)).toThrow("Unknown piece: null");
    });
  });

  describe("getPromoteToPiece", () => {
    it("should return promotion piece for white pawn promoting", () => {
      expect(getPromoteToPiece("e7", "e8", "p", "q")).toBe("q");
    });

    it("should return promotion piece for white pawn capturing and promoting", () => {
      expect(getPromoteToPiece("e7", "d8", "p", "r")).toBe("r");
    });

    it("should return promotion piece for black pawn promoting", () => {
      expect(getPromoteToPiece("a2", "a1", "p", "n")).toBe("n");
    });

    it("should return promotion piece for black pawn capturing and promoting", () => {
      expect(getPromoteToPiece("b2", "c1", "p", "b")).toBe("b");
    });

    it("should throw error when promotion piece not specified for promotion move", () => {
      expect(() => getPromoteToPiece("e7", "e8", "p", undefined)).toThrow(
        "Must specify promotedToPiece"
      );
    });

    it("should return undefined for non-promotion pawn move", () => {
      expect(getPromoteToPiece("e2", "e4", "p", undefined)).toBeUndefined();
    });

    it("should return undefined for piece that cannot promote", () => {
      expect(getPromoteToPiece("e1", "e2", "k", undefined)).toBeUndefined();
    });

    it("should return undefined for pawn not on promotion rank", () => {
      expect(getPromoteToPiece("e6", "e7", "p", undefined)).toBeUndefined();
    });
  });
});
