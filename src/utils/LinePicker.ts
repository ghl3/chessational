import { Line } from "@/chess/Line";
import { cdf, pdf } from "@stdlib/stats-base-dists-beta";
//import cdf from "@stdlib/stats-base-dists-beta-cdf";

import { Attempt } from "./Attempt";

export type MoveSelectionStrategy =
  | "DETERMINISTIC"
  | "RANDOM"
  | "LINE_WEIGHTED"
  | "SPACED_REPITITION"
  | "DATABASE_WEIGHTED";

const probabilityWithPrior = (
  numerator: number,
  denominator: number,
  numeratorPrior: number,
  denominatorPrior: number,
): number => {
  if (denominator < numerator || numerator < 0 || denominator <= 0) {
    throw new Error("Invalid input");
  }

  return (numerator + numeratorPrior) / (denominator + denominatorPrior);
};

const probabilityAboveThreshold = (
  numerator: number,
  denominator: number,
  threshold: number,
): number => {
  if (denominator < numerator || numerator < 0 || denominator <= 0) {
    throw new Error("Invalid input");
  }

  const alpha = numerator + 1;
  const beta = denominator - numerator + 1;

  // Calculate the CDF at the threshold
  const cdfAtThreshold = cdf(threshold, alpha, beta);

  // The probability that the true ratio is > threshold is 1 - CDF(threshold)
  return 1 - cdfAtThreshold;
};

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

export const calculateProbability = (
  lineId: string,
  attempts: Attempt[],
  confidenceThreshold: number = 0.9,
  defaultProbability: number = 0.5,
): number => {
  const totalNumberOfAttempts = attempts.length;

  const attemptsForLineAndIndices = attempts
    .map((attempt, index) => {
      return {
        attempt: attempt,
        index: totalNumberOfAttempts - index,
      };
    })
    .filter((attempt) => {
      return attempt.attempt.lineId === lineId;
    });

  if (attemptsForLineAndIndices.length === 0) {
    return defaultProbability;
  }

  const weightsAndsuccesses = attemptsForLineAndIndices.map((attempt) => {
    // Drop by 1/e every quarter of the way through the attempts
    const epsilon = totalNumberOfAttempts / 4;
    const weight = Math.exp(-attempt.index / epsilon);
    const success = attempt.attempt.correct ? 1 : 0;
    return { weight, success };
  });

  const totalWeight = weightsAndsuccesses.reduce(
    (sum, weightAndSuccess) => sum + weightAndSuccess.weight,
    0,
  );

  const weightedSuccesses = weightsAndsuccesses.reduce(
    (sum, weightAndSuccess) =>
      sum + weightAndSuccess.weight * weightAndSuccess.success,
    0,
  );

  //const probability = probabilityAboveThreshold(
  //  weightedSuccesses,
  //  totalWeight,
  //  confidenceThreshold,
  //);

  // Include a loose prior of 50% accuracy.
  const probability = probabilityWithPrior(
    weightedSuccesses,
    totalWeight,
    1,
    2,
  );

  return probability;
};

export const pickLine = (
  lines: Line[],
  strategy: MoveSelectionStrategy,
  attempts?: Attempt[],
): Line => {
  if (lines.length === 0) {
    throw new Error("No chapters to select from");
  }

  if (strategy === "DETERMINISTIC") {
    return lines[0];
  } else if (strategy === "RANDOM") {
    return lines[Math.floor(Math.random() * lines.length)];
  } else if (strategy === "SPACED_REPITITION") {
    if (attempts == null) {
      throw new Error("No attempts provided");
    }

    const probabilities = [];
    for (const line of lines) {
      const noise = Math.random() * 0.2 - 0.1;
      probabilities.push(
        calculateProbability(line.lineId, attempts, 0.5) + noise,
      );
    }

    // Pick the line with the lowest "known probability"
    const selectedLine = pickElementWithMinWeight(lines, probabilities);
    return selectedLine;
  } else if (strategy === "LINE_WEIGHTED") {
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
  } else if (strategy === "DATABASE_WEIGHTED") {
    throw new Error("Not implemented");
  }

  throw new Error("Invalid strategy");
};
