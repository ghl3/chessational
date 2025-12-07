import { Line } from "@/chess/Line";
import { Attempt } from "../chess/Attempt";
import { LineStats, getStats } from "./LineStats";

export type MoveSelectionStrategy =
  | "DETERMINISTIC"
  | "RANDOM"
  | "WEIGHTED"
  | "SPACED_REPETITION";

const weightedPick = <T>(elements: T[], weights: number[]): T => {
  if (elements.length !== weights.length) {
    throw new Error("Elements and weights must be of the same length");
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const cumulativeWeights: number[] = [];
  weights.reduce((cumulative, weight) => {
    cumulative += weight / totalWeight;
    cumulativeWeights.push(cumulative);
    return cumulative;
  }, 0);

  const random = Math.random();
  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (random < cumulativeWeights[i]) {
      return elements[i];
    }
  }

  // Fallback, should not normally be reached unless there's an issue with the weights
  return elements[0];
};

const pickElementWithMinWeight = <T>(elements: T[], weights: number[]): T => {
  if (elements.length !== weights.length) {
    throw new Error("Elements and weights must be of the same length");
  }

  const minWeightIndex = weights.reduce((minIndex, weight, index) => {
    if (weight < weights[minIndex]) {
      return index;
    } else {
      return minIndex;
    }
  }, 0);

  return elements[minWeightIndex];
};

const pickLineDeterministic = (lines: Line[]): Line => {
  return lines[0];
};

const pickLineRandom = (lines: Line[]): Line => {
  return lines[Math.floor(Math.random() * lines.length)];
};

const getLineForAttempt = (attempt: Attempt, lines: Line[]): Line | null => {
  return lines.find((line) => line.lineId === attempt.lineId) || null;
};

const findLastAttempt = (attempts: Attempt[]): Attempt => {
  // Don't assume the attempts are sorted
  return attempts.reduce((latest, attempt) => {
    if (latest.timestamp < attempt.timestamp) {
      return attempt;
    } else {
      return latest;
    }
  });
};

// Returns a random number between -0.2 and 0.2
const makeNoise = (size: number = 0.2): number => {
  return Math.random() * size * 2 - size;
};

const pickLineSpacedRepetition = (lines: Line[], attempts: Attempt[]): Line => {
  if (attempts.length === 0) {
    return pickLineRandom(lines);
  }

  // If the most recent attempt was incorrect, deterministically return that line
  const lastAttempt = findLastAttempt(attempts);
  if (!lastAttempt.correct) {
    return getLineForAttempt(lastAttempt, lines) || pickLineRandom(lines);
  }

  const lineStats: Map<string, LineStats> = getStats(attempts);

  const weights = lines.map((line) => {
    const stats = lineStats.get(line.lineId) || null;
    if (stats === null || stats.numAttempts === 0) {
      return makeNoise(0.2);
    } else {
      return stats.estimatedSuccessRate + makeNoise(0.2);
    }
  });

  return pickElementWithMinWeight(lines, weights);
};

const pickLineWeighted = (lines: Line[]): Line => {
  const numLinesPerChapter = lines
    .map((line) => line.chapterName)
    .reduce(
      (acc, chapterName) => {
        acc[chapterName] = (acc[chapterName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

  // Pick a chapter weighted by the number of lines in the chapter
  const chapterNames = Object.keys(numLinesPerChapter);
  const chapterWeights = Object.values(numLinesPerChapter);
  const selectedChapter = weightedPick(chapterNames, chapterWeights);

  const linesForChapter = lines.filter(
    (line) => line.chapterName === selectedChapter,
  );

  // Now, randomly pick a line from that chapter
  return linesForChapter[Math.floor(Math.random() * linesForChapter.length)];
};

export const pickLine = (
  lines: Line[],
  strategy: MoveSelectionStrategy,
  attempts?: Attempt[],
): Line => {
  if (lines.length === 0) {
    throw new Error("No chapters to select from");
  } else if (strategy === "DETERMINISTIC") {
    return pickLineDeterministic(lines);
  } else if (strategy === "RANDOM") {
    return pickLineRandom(lines);
  } else if (strategy === "WEIGHTED") {
    return pickLineWeighted(lines);
  } else if (strategy === "SPACED_REPETITION") {
    return pickLineSpacedRepetition(lines, attempts || []);
  } else {
    throw new Error("Invalid strategy");
  }
};
