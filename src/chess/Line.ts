import { Chapter, MoveNode, Node } from "./Chapter";
import { Fen } from "./Fen";
import { Move } from "./Move";

export interface Line {
  chapter: Chapter;
  moves: Move[];
}

export type LineStatus =
  | "SELECT_MOVE_FOR_WHITE"
  | "SELECT_MOVE_FOR_BLACK"
  | "LINE_COMPLETE";

export const getLineStatus = (line: Line, index: number): LineStatus => {
  if (index === line.moves.length) {
    return "LINE_COMPLETE";
  } else if (index % 2 === 0) {
    return "SELECT_MOVE_FOR_WHITE";
  } else {
    return "SELECT_MOVE_FOR_BLACK";
  }
};

export type MoveSelectionStrategy =
  | "DETERMINISTIC"
  | "RANDOM"
  | "LINE_WEIGHTED"
  | "DATABASE_WEIGHTED";

const getNumberOfLines = (node: Node): number => {
  // Counts the number of leaf nodes in the chapter's move tree
  const countLeafNodes = (node: Node): number => {
    if (node.children.length === 0) {
      return 1;
    } else {
      return node.children.reduce((a, b) => a + countLeafNodes(b), 0);
    }
  };

  return countLeafNodes(node);
};

const getRandomMove = (
  node: Node,
  strategy: MoveSelectionStrategy
): MoveNode => {
  const children = node.children;

  if (children.length === 0) {
    throw new Error("No children");
  }
  if (strategy === "DETERMINISTIC") {
    return children[0];
  } else if (strategy === "RANDOM") {
    const randomIndex = Math.floor(Math.random() * children.length);
    return children[randomIndex];
  } else if (strategy == "LINE_WEIGHTED") {
    const linesPerMove = children.map(getNumberOfLines);
    const totalLines = linesPerMove.reduce((a, b) => a + b, 0);
    const randomIndex = Math.floor(Math.random() * totalLines);
    let runningTotal = 0;
    for (let i = 0; i < linesPerMove.length; i++) {
      runningTotal += linesPerMove[i];
      if (runningTotal > randomIndex) {
        return children[i];
      }
    }
    throw new Error("Should never get here");
  } else if (strategy === "DATABASE_WEIGHTED") {
    throw new Error("Not implemented");
  } else {
    throw new Error("Invalid strategy");
  }
};

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
    const linesPerChapter = chapters.map((chapter) =>
      getNumberOfLines(chapter.moveTree)
    );
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

const createPositionIndex = (node: Node): Map<Fen, MoveNode[]> => {
  const positionIndex = new Map<Fen, MoveNode[]>();

  const addNode = (node: MoveNode) => {
    const fen: Fen = node.fen;

    const existingNodes = positionIndex.get(fen);
    if (existingNodes) {
      existingNodes.push(node);
    } else {
      positionIndex.set(fen, [node]);
    }

    node.children.forEach(addNode);
  };

  if ("fen" in node) {
    // Assuming only MoveNode has 'fen'
    addNode(node as MoveNode);
  }

  return positionIndex;
};

export const pickLine = (
  chapters: Chapter[],
  strategy: MoveSelectionStrategy
): Line => {
  // First, pick a chapter at random
  const chapter = selectChapter(chapters, strategy);

  const line: Line = {
    chapter,
    moves: [],
  };

  var node: Node = chapter.moveTree;

  const positionIndex = createPositionIndex(node);

  const getTranspositions = (node: Node): MoveNode[] => {
    if (!("fen" in node)) {
      return [];
    }

    const fen: Fen = node.fen;

    const transpositions = positionIndex.get(fen);

    if (transpositions === undefined) {
      return [];
    } else {
      return transpositions.filter((n) => n !== node);
    }
  };

  const orientation = chapter.orientation;

  if (orientation === "w") {
    const firstMove = getRandomMove(node, strategy);
    node = firstMove;
    line.moves.push(firstMove);
  }

  const visitedNodes = new Set<Node>();

  while (true) {
    visitedNodes.add(node);

    // First, see if we should break
    const hasNoChildren =
      node.children.length == 0 ||
      node.children.some((child) => child.children.length == 0);

    const transpositions = getTranspositions(node).filter(
      (n) => !visitedNodes.has(n)
    );

    if (hasNoChildren && transpositions.length === 0) {
      break;
    }

    if (hasNoChildren && transpositions.length > 0) {
      // Select a transposition at random
      // TODO: Select based on the strategy
      node = transpositions[Math.floor(Math.random() * transpositions.length)];
      continue;
    }

    // First, pick an opponent's move
    const opponentMove = getRandomMove(node, strategy);
    node = opponentMove;
    line.moves.push(opponentMove);

    if (node.children.length === 0) {
      throw new Error("Unexpected end of line");
    }

    // Then, pick the player's next move
    const playerMove = getRandomMove(node, strategy);
    node = playerMove;
    line.moves.push(playerMove);
  }

  return line;
};
