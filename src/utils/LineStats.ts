import { cdf, pdf } from "@stdlib/stats-base-dists-beta";
import { Attempt } from "./Attempt";

export type LineStats = {
  study: string;
  chapter: string;
  lineId: string;
  numAttempts: number;
  numCorrect: number;
  numWrong: number;
  latestAttempt: Date;
  latestSuccess: Date;
  estimatedSuccessRate: number;
};

const groupBy = <T, K extends keyof any>(
  array: T[],
  grouper: (item: T) => K,
): Record<K, T[]> => {
  return array.reduce(
    (result, currentValue) => {
      const groupKey = grouper(currentValue);
      (result[groupKey] = result[groupKey] || []).push(currentValue);
      return result;
    },
    {} as Record<K, T[]>,
  );
};

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

export const calculateProbability = (
  attempts: Attempt[],
  defaultProbability: number = 0.5,
  currentTime: Date = new Date(),
  halflifeInDays: number = 7,
): number => {
  const totalNumberOfAttempts = attempts.length;

  if (totalNumberOfAttempts === 0) {
    return defaultProbability;
  }

  const attemptWeightsAndSuccesses = attempts.map((attempt) => {
    const timeSinceAttempt =
      currentTime.getTime() - attempt.timestamp.getTime();
    const timeInDays = timeSinceAttempt / (1000 * 60 * 60 * 24);
    const weight = Math.exp(-timeInDays / halflifeInDays);
    const success = attempt.correct ? 1 : 0;
    return { weight, success };
  });

  const totalWeight = attemptWeightsAndSuccesses.reduce(
    (sum, weightAndSuccess) => sum + weightAndSuccess.weight,
    0,
  );

  const weightedSuccesses = attemptWeightsAndSuccesses.reduce(
    (sum, weightAndSuccess) =>
      sum + weightAndSuccess.weight * weightAndSuccess.success,
    0,
  );

  // Include a loose prior of 50% accuracy.
  const probability = probabilityWithPrior(
    weightedSuccesses,
    totalWeight,
    1,
    2,
  );

  return probability;
};

export const getStats = (attempts: Attempt[]): Map<string, LineStats> => {
  const statsPerLine = new Map<string, LineStats>();

  Object.entries(
    groupBy(attempts, (attempt: Attempt) => attempt.lineId),
  ).forEach(([lineId, attempts]) => {
    const stats: LineStats = {
      study: attempts[0].studyName,
      chapter: attempts[0].chapterName,
      lineId,
      numAttempts: 0,
      numCorrect: 0,
      numWrong: 0,
      latestAttempt: new Date(0),
      latestSuccess: new Date(0),
      estimatedSuccessRate: 0,
    };

    for (const attempt of attempts) {
      stats.numAttempts++;
      if (attempt.correct) {
        stats.numCorrect++;
        stats.latestSuccess = attempt.timestamp;
      } else {
        stats.numWrong++;
      }

      stats.latestAttempt =
        attempt.timestamp > stats.latestAttempt
          ? attempt.timestamp
          : stats.latestAttempt;
    }

    stats.estimatedSuccessRate = calculateProbability(attempts, 0.5);
    statsPerLine.set(lineId, stats);
  });

  return statsPerLine;
};
