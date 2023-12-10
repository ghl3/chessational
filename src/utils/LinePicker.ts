import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";

export type MoveSelectionStrategy =
  | "DETERMINISTIC"
  | "RANDOM"
  | "LINE_WEIGHTED"
  | "DATABASE_WEIGHTED";

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

export const pickLine = (
  lines: Line[],
  strategy: MoveSelectionStrategy,
): Line => {
  if (lines.length === 0) {
    throw new Error("No chapters to select from");
  }

  if (strategy === "DETERMINISTIC") {
    return lines[0];
  } else if (strategy === "RANDOM") {
    return lines[Math.floor(Math.random() * lines.length)];
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
