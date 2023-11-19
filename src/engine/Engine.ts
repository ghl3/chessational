import { Chess, Color } from "chess.js";
import { Fen, FenUtil } from "../chess/Fen";
import { makeComparator } from "./Comparator";
import { EvaluatedPosition, MoveAndEvaluation } from "./EvaluatedPosition";
import { Evaluation } from "./Evaluation";
import { EventParser, InfoMessage } from "./Parser";

interface WebWorker {
  onmessage: ((ev: MessageEvent<any>) => any) | null;
  postMessage: (x: any) => any;
}

type PositionResolver = (evaluation: EvaluatedPosition) => any;

export type PieceMove = {
  color: Color;
  from: string;
  to: string;
  san?: string;
  promotion?: string;
};

export class Engine {
  depth: number;
  debug: boolean;
  positions: Fen[];
  resolvers: PositionResolver[];
  movesAndEvals: MoveAndEvaluation[];
  worker: WebWorker;
  listener?: (evaluation: EvaluatedPosition) => any;

  // Defined using: new Worker(engine_path);
  constructor(worker: WebWorker, depth = 10, num_lines = 1, debug = false) {
    this.depth = depth;
    this.debug = debug;

    // Positions needing calculation
    this.positions = [];

    // When we get a best move message,
    // we call this function.
    this.resolvers = [];

    // A list of all the evaluations for the current position.
    this.movesAndEvals = [];

    // Construct and initialize the worker
    this.worker = worker;
    this.worker.onmessage = this._handleEvent;
    this.worker.postMessage("uci");
    // Use 32mb of RAM
    this.worker.postMessage("setoption name Threads value 4");
    this.worker.postMessage("setoption name Hash value 32");
    //this.worker.postMessage("setoption name Use NNUE value true");
    this.worker.postMessage("setoption name MultiPV value " + num_lines);
  }

  // Method to actually evaluate the position
  evaluatePosition = (fen: Fen): Promise<EvaluatedPosition> => {
    // Resolve: What do to with the answer
    // Reject: What to do when we can't get an answer
    return new Promise((resolve, reject) => {
      this._log("Engine -- Queueing eval of: " + fen);

      if (this.positions.length === 0) {
        // If the engine isn't running, we send right away
        this.positions.push(fen);
        this.resolvers.push(resolve);
        this._sendEvalMessage(fen);
      } else {
        // Otherwise, we add it to the queue
        // and the engine will work on it when the previous move is done.
        this.positions.push(fen);
        this.resolvers.push(resolve);
      }
    });
  };

  cancel = () => {
    if (this.positions.length === 0) {
      return;
    } else {
      // Only pick the first element so no future evals are done.
      this._log(
        "Engine -- Clearing future evals.  Currently running: " +
          this.positions[0],
      );
      this.positions = this.positions.slice(0, 1);
      this.resolvers = this.resolvers.slice(0, 1);
    }

    // Then, try to stop the current eval right away
    this._sendStopMessage();
  };

  _log = (message: string) => {
    if (this.debug) {
      console.log(message);
    }
  };

  _sendEvalMessage = (fen: Fen) => {
    this._log("Engine -- Sending Eval request for: " + fen);
    this.worker.postMessage("isready");
    this.worker.postMessage("position fen " + fen);
    this.worker.postMessage("go depth " + this.depth);
  };

  _sendStopMessage = () => {
    const fen = this.positions.length > 0 ? this.positions[0] : null;
    this._log(`Engine -- Sending Stop request for: ${fen}`);
    this.worker.postMessage("stop");
  };

  _createPositionEvaluation = (fen: Fen, color: Color): EvaluatedPosition => {
    // Determine the evaluation of the current position
    const bestMoves = Engine.selectBestMoves(color, this.movesAndEvals);

    const bestMovesDecorated: MoveAndEvaluation[] = [];
    for (const { move, evaluation } of bestMoves) {
      const chessObj = new Chess(fen);
      const m = chessObj.move(move);
      if (m == null) {
        throw new Error("Invalid move");
      } else {
        bestMovesDecorated.push({ move: m, evaluation: evaluation });
      }
    }

    return {
      fen,
      color,
      best_moves: bestMovesDecorated,
    };
  };

  _handleEvent = (e: MessageEvent<any>) => {
    const msg = e.data;
    const parsed = EventParser.parse(msg);
    this._log("Engine -- Received Message: " + msg);

    if (parsed.type === "INFO") {
      if (this.positions.length === 0) {
        throw new Error("No Positions Found");
      }

      // Get the resolved position
      const fen: Fen = this.positions[0];
      const color = FenUtil.getTurn(fen);

      const moveAndEval: MoveAndEvaluation | null =
        Engine.buildMoveAndEvaluationFromInfo(parsed, color);
      if (moveAndEval == null) {
        throw new Error(`Invalid Parsed Move: ${parsed}`);
      } else {
        this.movesAndEvals.push(moveAndEval);
        if (this.listener) {
          const positionEvaluation = this._createPositionEvaluation(fen, color);
          this.listener(positionEvaluation);
        }
      }
    }

    // Handle terminal positions
    if (
      parsed.type === "BESTMOVE" ||
      parsed.type === "ISMATE" ||
      parsed.type === "NOMOVE"
    ) {
      if (this.positions.length === 0) {
        throw new Error("No Positions Found");
      }

      // Get the resolved position
      const fen: Fen = this.positions.shift() as string;
      const resolver = this.resolvers.shift() as PositionResolver;

      // If there are more positions to evaluate, we kick off the evaluation of the
      // next position.
      if (this.positions.length > 0) {
        const nextFen = this.positions[0];
        this._log("Engine -- Kicking off eval of: " + nextFen);
        this._sendEvalMessage(nextFen);
      }

      if (parsed.type === "BESTMOVE") {
        this._log(
          "Engine -- Got Best Move for " +
            fen +
            ": " +
            parsed.from +
            "->" +
            parsed.to,
        );
      }
      if (parsed.type === "ISMATE") {
        this._log("Engine -- Checkmate found at: " + fen);
      }
      if (parsed.type === "NOMOVE") {
        this._log("Engine -- Game is over at: " + fen);
      }

      // 'w' for white, 'b' for black
      const color = FenUtil.getTurn(fen);
      const positionEvaluation = this._createPositionEvaluation(fen, color);

      // Reset movesAndEvals and resolve the result
      this.movesAndEvals = [];
      resolver(positionEvaluation);
    }
  };

  static getDeepestEvaluations = (
    movesAndEvaluations: MoveAndEvaluation[],
  ): MoveAndEvaluation[] => {
    var maxDepth = 0;
    for (const { evaluation } of Object.values(movesAndEvaluations)) {
      if (evaluation?.depth > maxDepth) {
        maxDepth = evaluation.depth;
      }
    }

    const getKey = (move: PieceMove): string => {
      return `${move?.from}${move?.to}${move?.promotion}`;
    };

    const moveEvalMap = new Map();

    for (const { move, evaluation } of Object.values(movesAndEvaluations)) {
      if (evaluation?.depth < maxDepth) {
        continue;
      }
      // TODO: Actually dedupe here.
      moveEvalMap.set(getKey(move), { move, evaluation });
    }

    // This should de-dupe using the latest evaluation in time per move/depth.
    // But we can probably do this more explicitly.
    return Array.from(moveEvalMap.values());
  };

  static selectBestMoves = (
    color: Color,
    movesAndEvaluations: MoveAndEvaluation[],
  ): MoveAndEvaluation[] => {
    // Take the list of INFO messages
    // Dedupe to find the latest depth
    // Expand all the pultipvs for it
    // Return the line and the score for each

    if (movesAndEvaluations.length === 0) {
      return [];
    }

    const color_factor = color === "w" ? 1 : -1;

    // TODO: Dedupe
    // Example:
    // Engine -- Received Message: info depth 18 seldepth 26 multipv 4 score cp 0 nodes 11421948 nps 616769 hashfull 999 time 18519 pv c8b7 f1e1 f6d7 c1e3 c6c5 d4c5 d7c5 e3c5 d6c5 d1e2 b7a6 e2e3 g7d4 e3h6 d4g7 h6e3 bmc 5.63221
    // Engine -- Received Message: info depth 18 seldepth 26 multipv 4 score cp 0 nodes 14182514 nps 615240 hashfull 999 time 23052 pv c8b7 f1e1 f6d7 c1e3 c6c5 d4c5 d7c5 e3c5 d6c5 d1e2 b7a6 e2e3 g7d4 e3h6 d4g7 h6e3 bmc 7.63221
    // Dedupe based on time.

    // Take all the evals and sort.
    // We want the deepest and best evals to appear first
    const sortedMovesAndEvaluations = Engine.getDeepestEvaluations(
      movesAndEvaluations,
    ).sort(
      makeComparator((x) => [
        // Sort by "mate in x" for the player, where lower x is better.
        x?.evaluation?.forced_mate?.for === "PLAYER"
          ? x?.evaluation?.forced_mate?.in
          : Number.MAX_VALUE,

        // (score * color_factor) is higher for better positions for the current player.
        // We include an additional -1 to make the sort descending.
        -1 * x?.evaluation?.score * color_factor || Number.MAX_VALUE,

        // Sort by "mate in x" for opponent, where higher x is better.
        // We include the -1 to reverse the sort so higher numbers come first.
        x?.evaluation?.forced_mate?.for === "OPPONENT"
          ? -1 * x?.evaluation?.forced_mate?.in
          : Number.MAX_VALUE,
      ]),
    );

    const depth = sortedMovesAndEvaluations[0]?.evaluation?.depth;
    const bestMoves: MoveAndEvaluation[] = [];
    for (const { move, evaluation } of sortedMovesAndEvaluations) {
      if (evaluation?.depth < depth) {
        continue;
      }
      bestMoves.push({ move, evaluation });
    }
    return bestMoves;
  };

  static buildMoveAndEvaluationFromInfo = (
    info: InfoMessage,
    color: Color,
  ): MoveAndEvaluation | null => {
    if ("pv" in info && info["pv"].length > 0) {
      const from = info.pv[0].slice(0, 2);
      const to = info.pv[0].slice(2, 4);
      const move: PieceMove = { from: from, to: to, color: color };
      if (info.pv[0].length === 5) {
        move["promotion"] = info.pv[0][4];
      }
      return {
        move: move,
        evaluation: Engine.buildEvaluationFromInfo(info, color),
      };
    } else {
      return null;
    }
  };

  // parsed: A dict
  static buildEvaluationFromInfo = (
    info: InfoMessage,
    color: Color,
  ): Evaluation => {
    // Convert from an Info (using UCI's conventions) to an Evaluation
    // (using normal conventions).
    // In UCI convention, all scores are relative to the current player
    // (not the color).  We convert these to be relative to the color
    // (such that positive is favorable to white and negative is
    // favorable to black).
    if (info?.score?.cp != null) {
      const s: number = color === "w" ? info.score.cp : -1 * info.score.cp;
      return { score: s, depth: info?.depth };
    } else if (info?.score?.mate !== undefined) {
      const mate_in = Math.abs(info.score.mate);
      const mate_for = info.score.mate > 0 ? "PLAYER" : "OPPONENT";
      return {
        forced_mate: { in: mate_in, for: mate_for },
        depth: info?.depth,
      };
    } else {
      return { depth: info?.depth };
    }
  };
}
