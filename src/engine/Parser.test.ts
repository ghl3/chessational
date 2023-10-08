import { EventParser } from '../engine/Parser';

test('parse readyok', () => {
    const res = EventParser.parse("readyok");
    expect(res).toStrictEqual({ type: "READY" });
});

test('parse mate', () => {
    const res = EventParser.parse("info depth 0 score mate 0");
    expect(res).toStrictEqual({ type: "INFO", depth: 0, score: { mate: 0 } });
});

test('parse opponent mate', () => {
    const res = EventParser.parse("info score mate -13 ");
    expect(res).toStrictEqual({ type: "INFO", score: { mate: -13 } });
});

test('parse no best move', () => {
    const res = EventParser.parse("bestmove (none)");
    expect(res).toStrictEqual({ type: "NOMOVE" });
});

test('parse best move', () => {
    const res = EventParser.parse("bestmove f3h3");
    expect(res).toStrictEqual({ type: "BESTMOVE", from: "f3", to: "h3" });
});

test('parse best move promote', () => {
    const res = EventParser.parse("bestmove e7e8q");
    expect(res).toStrictEqual({ type: "BESTMOVE", from: "e7", to: "e8", promotion: "q" });
});

test('parse best move ponder', () => {
    const res = EventParser.parse("bestmove g3h4 ponder g7g5");
    expect(res).toStrictEqual({ type: "BESTMOVE", from: "g3", to: "h4" });
});

test('parse best move promote promote', () => {
    const res = EventParser.parse("bestmove e7e8q ponder ponder g7g5");
    expect(res).toStrictEqual({ type: "BESTMOVE", from: "e7", to: "e8", promotion: "q" });
});

test('parse info 1', () => {
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
    expect(res).toStrictEqual({
        type: "INFO",
        depth: 15,
        multipv: 1,
        pv: ["e7e5", "g1f3", "g8f6", "f3e5", "d7d6", "e5f3", "f6e4", "b1c3", "e4c3", "d2c3", "b8c6", "f1b5", "f8e7", "e1g1", "e8g8", "f1e1", "c8e6"],
        nodes: 441442,
        nps: 448619,
        score: {
            cp: -13,
        },
        seldepth: 22,
        time: 984,
        bmc: 0.155722
    });
});

test('parse info 2', () => {
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
    expect(res).toStrictEqual({
        type: "INFO",
        depth: 15,
        multipv: 4,
        pv: ["d8c8", "g1h2", "c6d8", "g2g4", "h5g6", "f3h4", "g8h8", "f2f4", "e5f4", "c1f4", "d8e6", "c4e6", "c8e6", "e4e5", "d6e5", "h4g6", "f7g6", "f4e5"],
        nodes: 1279433,
        nps: 584215,
        score: {
            cp: -37,
        },
        seldepth: 20,
        time: 2190,
        hashfull: 564,
        bmc: 5.50041
    });
});

