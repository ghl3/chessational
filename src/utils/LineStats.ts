import { Attempt } from "../chess/Attempt";

// Default configuration for knowledge score calculations
export const DEFAULT_HALFLIFE_DAYS = 28;
export const DEFAULT_STALENESS_WEIGHT = 0.3;
export const DEFAULT_NOISE_SIZE = 0.2;

export type LineStats = {
  study: string;
  chapter: string;
  lineId: string;
  numAttempts: number;
  numCorrect: number;
  numWrong: number;
  latestAttempt: Date;
  latestSuccess: Date;
  // Raw success rate: numCorrect / numAttempts (historical accuracy)
  rawSuccessRate: number;
  // Time-weighted Bayesian success probability (current knowledge estimate)
  estimatedSuccessRate: number;
  // Days since last attempt (for staleness calculation)
  daysSinceLastAttempt: number;
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

export const calculateProbability = (
  attempts: Attempt[],
  defaultProbability: number = 0.5,
  currentTime: Date = new Date(),
  halflifeInDays: number = 28,
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

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.abs(date2.getTime() - date1.getTime()) / msPerDay;
};

/**
 * Calculate the review priority for a line.
 * Higher priority = more urgent need for review.
 *
 * Combines two factors:
 * 1. Knowledge weakness: (1 - estimatedSuccessRate) - how poorly the user knows this line
 * 2. Staleness: how long since last review (capped at 3x half-life)
 *
 * @param stats - Line statistics (null for never-practiced lines)
 * @param currentTime - Current time for staleness calculation
 * @param halfLifeDays - Memory decay half-life in days
 * @param stalenessWeight - How much staleness contributes to priority (0-1)
 * @returns Priority score (higher = needs review more urgently)
 */
export const calculateReviewPriority = (
  stats: LineStats | null,
  currentTime: Date = new Date(),
  halfLifeDays: number = DEFAULT_HALFLIFE_DAYS,
  stalenessWeight: number = DEFAULT_STALENESS_WEIGHT,
): number => {
  // Never-practiced lines get maximum priority
  if (!stats || stats.numAttempts === 0) {
    return 1.0;
  }

  const knowledge = stats.estimatedSuccessRate;
  const staleness = Math.min(stats.daysSinceLastAttempt / halfLifeDays, 3); // Cap at 3x half-life

  // Combine weakness and staleness
  // weakness ranges 0-1, staleness ranges 0-3, so scale staleness contribution
  return (1 - knowledge) + staleness * stalenessWeight;
};

// A map of LineId to the attempt stats
export const getStats = (
  attempts: Attempt[],
  currentTime: Date = new Date(),
): Map<string, LineStats> => {
  const statsPerLine = new Map<string, LineStats>();

  Object.entries(
    groupBy(attempts, (attempt: Attempt) => attempt.lineId),
  ).forEach(([lineId, lineAttempts]) => {
    const stats: LineStats = {
      study: lineAttempts[0].studyName,
      chapter: lineAttempts[0].chapterName,
      lineId,
      numAttempts: 0,
      numCorrect: 0,
      numWrong: 0,
      latestAttempt: new Date(0),
      latestSuccess: new Date(0),
      rawSuccessRate: 0,
      estimatedSuccessRate: 0,
      daysSinceLastAttempt: Infinity,
    };

    for (const attempt of lineAttempts) {
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

    // Calculate derived statistics
    stats.rawSuccessRate =
      stats.numAttempts > 0 ? stats.numCorrect / stats.numAttempts : 0;
    stats.estimatedSuccessRate = calculateProbability(
      lineAttempts,
      0.5,
      currentTime,
    );
    stats.daysSinceLastAttempt = daysBetween(stats.latestAttempt, currentTime);

    statsPerLine.set(lineId, stats);
  });

  return statsPerLine;
};
