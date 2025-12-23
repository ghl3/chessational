import { Line } from "@/chess/Line";
import { Attempt } from "../chess/Attempt";
import {
  calculateReviewPriority,
  DEFAULT_HALFLIFE_DAYS,
  DEFAULT_NOISE_SIZE,
  DEFAULT_STALENESS_WEIGHT,
  getStats,
  LineStats,
} from "./LineStats";

export type MoveSelectionStrategy =
  | "DETERMINISTIC"
  | "RANDOM"
  | "WEIGHTED"
  | "SPACED_REPETITION";

/**
 * Configuration options for spaced repetition line selection
 */
export interface SpacedRepetitionConfig {
  /** Memory decay half-life in days (default: 28) */
  halfLifeDays: number;
  /** How much staleness contributes to priority (default: 0.3) */
  stalenessWeight: number;
  /** Size of randomization noise (default: 0.2) */
  noiseSize: number;
  /** Current time for calculations (default: now) */
  currentTime: Date;
}

const DEFAULT_CONFIG: SpacedRepetitionConfig = {
  halfLifeDays: DEFAULT_HALFLIFE_DAYS,
  stalenessWeight: DEFAULT_STALENESS_WEIGHT,
  noiseSize: DEFAULT_NOISE_SIZE,
  currentTime: new Date(),
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Pick a random element from an array using weighted probabilities.
 * Elements with higher weights are more likely to be selected.
 */
export const weightedPick = <T>(elements: T[], weights: number[]): T => {
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

/**
 * Pick the element with the maximum weight value.
 */
export const pickElementWithMaxWeight = <T>(
  elements: T[],
  weights: number[],
): T => {
  if (elements.length !== weights.length) {
    throw new Error("Elements and weights must be of the same length");
  }

  const maxWeightIndex = weights.reduce((maxIndex, weight, index) => {
    if (weight > weights[maxIndex]) {
      return index;
    } else {
      return maxIndex;
    }
  }, 0);

  return elements[maxWeightIndex];
};

/**
 * Generate a random number in the range [-size, +size]
 */
export const makeNoise = (size: number = DEFAULT_NOISE_SIZE): number => {
  return Math.random() * size * 2 - size;
};

// ============================================================================
// Line Selection Strategies
// ============================================================================

/**
 * Pick the first line (deterministic, for testing)
 */
const pickLineDeterministic = (lines: Line[]): Line => {
  return lines[0];
};

/**
 * Pick a random line with uniform distribution
 */
const pickLineRandom = (lines: Line[]): Line => {
  return lines[Math.floor(Math.random() * lines.length)];
};

/**
 * Find a line by its lineId
 */
const getLineById = (lineId: string, lines: Line[]): Line | null => {
  return lines.find((line) => line.lineId === lineId) || null;
};

/**
 * Find the most recent attempt from a list of attempts
 */
export const findLastAttempt = (attempts: Attempt[]): Attempt | null => {
  if (attempts.length === 0) {
    return null;
  }
  return attempts.reduce((latest, attempt) => {
    if (latest.timestamp < attempt.timestamp) {
      return attempt;
    } else {
      return latest;
    }
  });
};

/**
 * Pick a line weighted by chapter size.
 * First picks a chapter (weighted by number of lines), then picks a random line from that chapter.
 */
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

/**
 * Calculate priority scores for all lines based on review urgency.
 *
 * Priority is determined by:
 * 1. Knowledge weakness: (1 - estimatedSuccessRate)
 * 2. Staleness: how long since last review
 *
 * Higher priority = needs review more urgently.
 */
export const calculateLinePriorities = (
  lines: Line[],
  attempts: Attempt[],
  config: SpacedRepetitionConfig = DEFAULT_CONFIG,
): { line: Line; priority: number; stats: LineStats | null }[] => {
  const lineStats = getStats(attempts, config.currentTime);

  return lines.map((line) => {
    const stats = lineStats.get(line.lineId) || null;
    const basePriority = calculateReviewPriority(
      stats,
      config.currentTime,
      config.halfLifeDays,
      config.stalenessWeight,
    );

    return {
      line,
      priority: basePriority,
      stats,
    };
  });
};

/**
 * Pick a line using spaced repetition algorithm optimized for burst studying.
 *
 * Algorithm:
 * 1. If the most recent attempt was incorrect, retry that line immediately
 * 2. Calculate review priority for each line (combines weakness + staleness)
 * 3. Add noise for variety
 * 4. Select the line with highest priority
 *
 * This approach:
 * - Prioritizes weak lines (low knowledge score)
 * - Gradually increases priority for stale lines (not reviewed recently)
 * - Works well for burst study patterns (no "overdue" debt)
 */
const pickLineSpacedRepetition = (
  lines: Line[],
  attempts: Attempt[],
  config: SpacedRepetitionConfig = DEFAULT_CONFIG,
): Line => {
  // If no attempts yet, pick randomly
  if (attempts.length === 0) {
    return pickLineRandom(lines);
  }

  // If the most recent attempt was incorrect, retry that line immediately
  const lastAttempt = findLastAttempt(attempts);
  if (lastAttempt && !lastAttempt.correct) {
    const retryLine = getLineById(lastAttempt.lineId, lines);
    if (retryLine) {
      return retryLine;
    }
    // Line no longer exists in the current selection, fall through to normal selection
  }

  // Calculate priorities with noise for variety
  const priorities = calculateLinePriorities(lines, attempts, config);
  const prioritiesWithNoise = priorities.map((p) => ({
    line: p.line,
    priority: p.priority + makeNoise(config.noiseSize),
  }));

  // Pick the line with highest priority (most urgent need for review)
  return pickElementWithMaxWeight(
    prioritiesWithNoise.map((p) => p.line),
    prioritiesWithNoise.map((p) => p.priority),
  );
};

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Pick a line to review based on the specified strategy.
 *
 * @param lines - Available lines to choose from
 * @param strategy - Selection strategy
 * @param attempts - Historical attempts (required for SPACED_REPETITION)
 * @param config - Configuration for spaced repetition (optional)
 * @returns The selected line
 */
export const pickLine = (
  lines: Line[],
  strategy: MoveSelectionStrategy,
  attempts?: Attempt[],
  config?: Partial<SpacedRepetitionConfig>,
): Line => {
  if (lines.length === 0) {
    throw new Error("No lines to select from");
  }

  switch (strategy) {
    case "DETERMINISTIC":
      return pickLineDeterministic(lines);
    case "RANDOM":
      return pickLineRandom(lines);
    case "WEIGHTED":
      return pickLineWeighted(lines);
    case "SPACED_REPETITION":
      return pickLineSpacedRepetition(lines, attempts || [], {
        ...DEFAULT_CONFIG,
        ...config,
        currentTime: config?.currentTime || new Date(),
      });
    default:
      throw new Error(`Invalid strategy: ${strategy}`);
  }
};
