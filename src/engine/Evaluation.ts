export interface ForcedMate {
  in: number;
  for: "PLAYER" | "OPPONENT";
}

export interface Mate {
  for: "PLAYER" | "OPPONENT";
}

export interface Evaluation {
  score?: number | null;
  forced_mate?: ForcedMate | null;
  mate?: Mate | null;
  depth: number;
}

export class EvaluationUtil {
  static toScoreString = (n: number) => {
    if (n === 0) {
      return "0.0";
    } else {
      return `${n > 0 ? "+" : "-"}${Math.abs(n) / 100}`;
    }
  };

  static toEvalString = (evaluation: Evaluation) => {
    if (evaluation?.score !== null && evaluation?.score !== undefined) {
      return EvaluationUtil.toScoreString(evaluation.score);
    } else if (evaluation?.forced_mate !== null && evaluation?.forced_mate !== undefined) {
      return `Mate in ${evaluation.forced_mate.in} for ${evaluation.forced_mate.for}`;
    } else if (evaluation.mate !== null && evaluation.mate !== undefined) {
      return `Checkmate (${evaluation.mate.for} wins)`;
    } else {
      throw new Error("Invalid Evaluation");
    }
  };
}
