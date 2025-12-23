import { EventParser } from "../engine/Parser";

describe("EventParser", () => {
  describe("parse", () => {
    it("parses readyok", () => {
      expect(EventParser.parse("readyok")).toEqual({ type: "READY" });
    });

    it("parses mate score", () => {
      expect(EventParser.parse("info depth 0 score mate 0")).toEqual({
        type: "INFO",
        depth: 0,
        score: { mate: 0 },
      });
    });

    it("parses negative mate score", () => {
      expect(EventParser.parse("info score mate -13 ")).toEqual({
        type: "INFO",
        score: { mate: -13 },
      });
    });

    it("parses no best move", () => {
      expect(EventParser.parse("bestmove (none)")).toEqual({ type: "NOMOVE" });
    });

    it("parses best move", () => {
      expect(EventParser.parse("bestmove f3h3")).toEqual({
        type: "BESTMOVE",
        from: "f3",
        to: "h3",
      });
    });

    it("parses best move with promotion", () => {
      expect(EventParser.parse("bestmove e7e8q")).toEqual({
        type: "BESTMOVE",
        from: "e7",
        to: "e8",
        promotion: "q",
      });
    });

    it("parses best move ignoring ponder", () => {
      expect(EventParser.parse("bestmove g3h4 ponder g7g5")).toEqual({
        type: "BESTMOVE",
        from: "g3",
        to: "h4",
      });
    });

    it("parses best move with promotion ignoring ponder", () => {
      expect(EventParser.parse("bestmove e7e8q ponder ponder g7g5")).toEqual({
        type: "BESTMOVE",
        from: "e7",
        to: "e8",
        promotion: "q",
      });
    });
  });

  describe("parseInfo", () => {
    it("parses full info string with pv", () => {
      const res = EventParser.parseInfo(`info
    depth 15
    seldepth 22
    multipv 1
    score cp -13
    nodes 441442
    nps 448619
    time 984
    pv e7e5 g1f3 g8f6 f3e5 d7d6 e5f3 f6e4 b1c3 e4c3 d2c3 b8c6 f1b5 f8e7 e1g1 e8g8 f1e1 c8e6
    bmc 0.155722`);

      expect(res).toEqual({
        type: "INFO",
        depth: 15,
        multipv: 1,
        pv: [
          "e7e5",
          "g1f3",
          "g8f6",
          "f3e5",
          "d7d6",
          "e5f3",
          "f6e4",
          "b1c3",
          "e4c3",
          "d2c3",
          "b8c6",
          "f1b5",
          "f8e7",
          "e1g1",
          "e8g8",
          "f1e1",
          "c8e6",
        ],
        nodes: 441442,
        nps: 448619,
        score: {
          cp: -13,
        },
        seldepth: 22,
        time: 984,
        bmc: 0.155722,
      });
    });

    it("parses info string with hashfull", () => {
      const res = EventParser.parseInfo(`info
    depth 15
    seldepth 20
    multipv 4
    score cp -37
    nodes 1279433
    nps 584215
    hashfull 564
    time 2190
    pv d8c8 g1h2 c6d8 g2g4 h5g6 f3h4 g8h8 f2f4 e5f4 c1f4 d8e6 c4e6 c8e6 e4e5 d6e5 h4g6 f7g6 f4e5
    bmc 5.50041`);

      expect(res).toEqual({
        type: "INFO",
        depth: 15,
        multipv: 4,
        pv: [
          "d8c8",
          "g1h2",
          "c6d8",
          "g2g4",
          "h5g6",
          "f3h4",
          "g8h8",
          "f2f4",
          "e5f4",
          "c1f4",
          "d8e6",
          "c4e6",
          "c8e6",
          "e4e5",
          "d6e5",
          "h4g6",
          "f7g6",
          "f4e5",
        ],
        nodes: 1279433,
        nps: 584215,
        score: {
          cp: -37,
        },
        seldepth: 20,
        time: 2190,
        hashfull: 564,
        bmc: 5.50041,
      });
    });
  });
});
