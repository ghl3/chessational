import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";

export type ChapterAndLine = {
  chapter: Chapter;
  line: Line;
};

export type MoveSelectionStrategy =
  | "DETERMINISTIC"
  | "RANDOM"
  | "LINE_WEIGHTED"
  | "DATABASE_WEIGHTED";

const selectChapter = (
  chapters: Chapter[],
  strategy: MoveSelectionStrategy,
): Chapter => {
  if (chapters.length === 0) {
    throw new Error("No chapters to select from");
  }

  if (strategy === "DETERMINISTIC") {
    return chapters[0];
  } else if (strategy === "RANDOM") {
    return chapters[Math.floor(Math.random() * chapters.length)];
  } else if (strategy === "LINE_WEIGHTED") {
    const linesPerChapter = chapters.map((chapter) => chapter.lines.length);
    const totalLines = linesPerChapter.reduce((a, b) => a + b, 0);
    const randomIndex = Math.floor(Math.random() * totalLines);
    let runningTotal = 0;
    for (let i = 0; i < linesPerChapter.length; i++) {
      runningTotal += linesPerChapter[i];
      if (runningTotal > randomIndex) {
        return chapters[i];
      }
    }
  } else if (strategy === "DATABASE_WEIGHTED") {
    throw new Error("Not implemented");
  }

  throw new Error("Invalid strategy");
};

const selectLine = (lines: Line[], strategy: MoveSelectionStrategy): Line => {
  if (lines.length === 0) {
    throw new Error("No lines to select from");
  }

  if (strategy === "DETERMINISTIC") {
    return lines[0];
  } else if (strategy === "RANDOM") {
    return lines[Math.floor(Math.random() * lines.length)];
  } else if (strategy === "LINE_WEIGHTED") {
    throw new Error("Not implemented");
  } else if (strategy === "DATABASE_WEIGHTED") {
    throw new Error("Not implemented");
  }

  throw new Error("Invalid strategy");
};

export const pickLine = (
  chapters: Chapter[],
  strategy: MoveSelectionStrategy,
): ChapterAndLine => {
  // First, pick a chapter at random
  const chapter = selectChapter(chapters, strategy);

  // Then, pick a line from the chapter
  const line = selectLine(chapter.lines, strategy);

  return { chapter, line };
};
