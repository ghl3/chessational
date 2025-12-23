import { Chess } from "chess.js";
import { getGameResult, createPosition } from "./Position";

describe("Position utilities", () => {
  describe("getGameResult", () => {
    it("returns UNKNOWN for starting position", () => {
      const chess = new Chess();
      expect(getGameResult(chess)).toBe("UNKNOWN");
    });

    it("returns CHECKMATE for checkmate position", () => {
      const chess = new Chess();
      chess.move("f3");
      chess.move("e5");
      chess.move("g4");
      chess.move("Qh4");

      expect(chess.isCheckmate()).toBe(true);
      expect(getGameResult(chess)).toBe("CHECKMATE");
    });

    it("returns STALEMATE for stalemate position", () => {
      const chess = new Chess("k7/2Q5/1K6/8/8/8/8/8 b - - 0 1");

      expect(chess.isStalemate()).toBe(true);
      expect(getGameResult(chess)).toBe("STALEMATE");
    });

    it("returns INSUFFICIENT_MATERIAL for K vs K", () => {
      const chess = new Chess("k7/8/8/8/8/8/8/7K w - - 0 1");

      expect(chess.isInsufficientMaterial()).toBe(true);
      expect(getGameResult(chess)).toBe("INSUFFICIENT_MATERIAL");
    });

    it("returns INSUFFICIENT_MATERIAL for K+B vs K", () => {
      const chess = new Chess("k7/8/8/8/8/8/8/5B1K w - - 0 1");

      expect(chess.isInsufficientMaterial()).toBe(true);
      expect(getGameResult(chess)).toBe("INSUFFICIENT_MATERIAL");
    });

    it("returns INSUFFICIENT_MATERIAL for K+N vs K", () => {
      const chess = new Chess("k7/8/8/8/8/8/8/5N1K w - - 0 1");

      expect(chess.isInsufficientMaterial()).toBe(true);
      expect(getGameResult(chess)).toBe("INSUFFICIENT_MATERIAL");
    });
  });

  describe("createPosition", () => {
    it("creates a position with the correct FEN", () => {
      const chess = new Chess();
      chess.move("e4");

      const move = {
        san: "e4",
        piece: "p" as const,
        from: "e2" as const,
        to: "e4" as const,
        player: "w" as const,
      };

      const position = createPosition(move, chess);

      expect(position.fen).toBe(
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
      );
      expect(position.lastMove).toEqual(move);
      expect(position.comments).toEqual([]);
      expect(position.isGameOver).toBe(false);
      expect(position.gameResult).toBe("UNKNOWN");
    });

    it("detects game over in checkmate position", () => {
      const chess = new Chess();
      chess.move("f3");
      chess.move("e5");
      chess.move("g4");
      chess.move("Qh4");

      const move = {
        san: "Qh4#",
        piece: "q" as const,
        from: "d8" as const,
        to: "h4" as const,
        player: "b" as const,
      };

      const position = createPosition(move, chess);

      expect(position.isGameOver).toBe(true);
      expect(position.gameResult).toBe("CHECKMATE");
    });

    it("detects stalemate", () => {
      const chess = new Chess("k7/8/1K6/8/8/8/2Q5/8 w - - 0 1");
      chess.move("Qc7");

      const move = {
        san: "Qc7",
        piece: "q" as const,
        from: "c2" as const,
        to: "c7" as const,
        player: "w" as const,
      };

      const position = createPosition(move, chess);

      expect(position.isGameOver).toBe(true);
      expect(position.gameResult).toBe("STALEMATE");
    });
  });
});
