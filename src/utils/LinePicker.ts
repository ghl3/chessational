import { Chapter } from "@/chess/Chapter";
import { Fen } from "@/chess/Fen";
import { Line, lineToSan } from "@/chess/Line";
import { Color } from "chess.js";

export type ChapterAndLine = {
  chapter: Chapter;
  line: Line;
};

export type MoveSelectionStrategy =
  | "DETERMINISTIC"
  | "RANDOM"
  | "LINE_WEIGHTED"
  | "DATABASE_WEIGHTED";

/*
export const getNumberOfLines = (node: Node): number => {
  // Counts the number of leaf nodes in the chapter's move tree
  const countLeafNodes = (n: Node): number => {
    if (n.children.length === 0) {
      return 1;
    } else {
      return n.children.map(countLeafNodes).reduce((a, b) => a + b, 0);
    }
  };

  return countLeafNodes(node);
};
*/
/*
const getRandomMove = (
  nodes: Node[],
  strategy: MoveSelectionStrategy
): Node => {
  if (nodes.length === 0) {
    throw new Error("No children");
  }
  if (strategy === "DETERMINISTIC") {
    return nodes[0];
  } else if (strategy === "RANDOM") {
    const randomIndex = Math.floor(Math.random() * nodes.length);
    return nodes[randomIndex];
  } else if (strategy == "LINE_WEIGHTED") {
    const linesPerMove = nodes.map(getNumberOfLines);
    const totalLines = linesPerMove.reduce((a, b) => a + b, 0);
    const randomIndex = Math.floor(Math.random() * totalLines);
    let runningTotal = 0;
    for (let i = 0; i < linesPerMove.length; i++) {
      runningTotal += linesPerMove[i];
      if (runningTotal > randomIndex) {
        return nodes[i];
      }
    }
    throw new Error("Should never get here");
  } else if (strategy === "DATABASE_WEIGHTED") {
    throw new Error("Not implemented");
  } else {
    throw new Error("Invalid strategy");
  }
};
*/

const selectChapter = (
  chapters: Chapter[],
  strategy: MoveSelectionStrategy
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
/*
const createPositionIndex = (node: Node): Map<Fen, Node[]> => {
  const positionIndex = new Map<Fen, Node[]>();

  const addNodeAndChildrenToIndex = (node: Node) => {
    const fen: Fen = node.position.fen;

    const existingNodes = positionIndex.get(fen);
    if (existingNodes) {
      existingNodes.push(node);
    } else {
      positionIndex.set(fen, [node]);
    }

    node.children.forEach(addNodeAndChildrenToIndex);
  };

  addNodeAndChildrenToIndex(node);

  return positionIndex;
};

const getTranspositions = (
  node: Node,
  positionIndex: Map<Fen, Node[]>
): Node[] => {
  const fen: Fen = node.position.fen;

  const transpositions = positionIndex.get(fen);

  if (transpositions === undefined) {
    return [];
  } else {
    return transpositions.filter((n) => n !== node);
  }
};
*/

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
  strategy: MoveSelectionStrategy
): ChapterAndLine => {
  // First, pick a chapter at random
  const chapter = selectChapter(chapters, strategy);

  // Then, pick a line from the chapter
  const line = selectLine(chapter.lines, strategy);

  return { chapter, line };
};
