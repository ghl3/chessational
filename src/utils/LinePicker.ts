import { Line } from "@/chess/Line";
import { Attempt } from "../chess/Attempt";
import { LineStats, getStats } from "./LineStats";

export type MoveSelectionStrategy =
  | "DETERMINISTIC"
  | "RANDOM"
  | "WEIGHTED"
  | "SPACED_REPITITION";

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

const pickLineSpacedRepitition = (lines: Line[], attempts: Attempt[]): Line => {
  if (attempts.length === 0) {
    return pickLineRandom(lines);
  }

  const lineStats: Map<string, LineStats> = getStats(attempts);

  const probabilities = [];
  for (const line of lines) {
    const stats = lineStats.get(line.lineId);
    const probability = stats?.estimatedSuccessRate || 0.5;
    const noise = Math.random() * 0.2 - 0.1;
    probabilities.push(probability + noise);
  }

  return pickElementWithMinWeight(lines, probabilities);
};

const pickLineWeighted = (lines: Line[]): Line => {
  const numLinesPerChapter = lines
    .map((line) => line.chapterName) // Extract chapter names
    .reduce(
      (acc, chapterName) => {
        acc[chapterName] = (acc[chapterName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ); // Initialize accumulator as a Record of string keys to number values

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
  } else if (strategy === "SPACED_REPITITION") {
    return pickLineSpacedRepitition(lines, attempts || []);
  } else {
    throw new Error("Invalid strategy");
  }
};
