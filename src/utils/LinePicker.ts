import { Chapter, MoveNode, Node, RootNode } from "@/chess/Chapter";
import { Fen } from "@/chess/Fen";
import { Line } from "@/chess/Line";
import { Color } from "chess.js";

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

const lineToSan = (line: Line): string[] => {
  return line.moves.map((move) => move.move);
};

const getRandomMove = (
  nodes: MoveNode[],
  strategy: MoveSelectionStrategy
): MoveNode => {
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

const createPositionIndex = (node: RootNode): Map<Fen, MoveNode[]> => {
  const positionIndex = new Map<Fen, MoveNode[]>();

  const addNodeAndChildren = (node: MoveNode) => {
    const fen: Fen = node.fen;

    const existingNodes = positionIndex.get(fen);
    if (existingNodes) {
      existingNodes.push(node);
    } else {
      positionIndex.set(fen, [node]);
    }

    node.children.forEach(addNodeAndChildren);
  };

  for (const child of node.children) {
    addNodeAndChildren(child);
  }

  return positionIndex;
};

const getTranspositions = (
  node: Node,
  positionIndex: Map<Fen, MoveNode[]>
): MoveNode[] => {
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

export const pickLine = (
  chapters: Chapter[],
  strategy: MoveSelectionStrategy
): Line => {
  // First, pick a chapter at random
  const chapter = selectChapter(chapters, strategy);

  const orientation: Color = chapter.orientation;

  var turn: "PLAYER" | "OPPONENT" = orientation === "w" ? "PLAYER" : "OPPONENT";

  var node: Node = chapter.moveTree;

  const positionIndex = createPositionIndex(node);

  const line: Line = {
    chapter,
    moves: [],
  };

  while (true) {
    var availableMoves = [];

    if (turn === "PLAYER") {
      const transpositionsWithChildren = getTranspositions(
        node,
        positionIndex
      ).filter((n) => n.children.length > 0);

      // There should be a single move for the player to make. We don't yet
      // support multiple lines (or alternate moves) for the player.
      if (node.children.length > 1) {
        throw new Error(
          "Multiple moves not implemented.  Encountered at line: " +
            lineToSan(line)
        );
      } else if (node.children.length == 1) {
        availableMoves = node.children;
      } else {
        if (transpositionsWithChildren.length > 0) {
          // If there are transpositions that have children, we jump to one of those
          // and continue with the line.
          node = getRandomMove(transpositionsWithChildren, strategy);
          continue;
        } else {
          throw new Error(
            "No moves available.  Encountered at line: " + lineToSan(line)
          );
        }
      }
    }

    // If we're picking a node for the opponent, we only select nodes that
    // have grandchildren.  This is because we need nodes that have a known
    // player response.  If there are no grandchildren, we should break.
    else {
      const hasChild = (node: Node): boolean => {
        return node.children.length > 0;
      };

      const transpositionsWithGrandChildren = getTranspositions(
        node,
        positionIndex
      ).filter((n) => n.children.length > 0 && n.children.some(hasChild));

      const childNodes = node.children.filter(hasChild);

      if (childNodes.length > 0) {
        availableMoves = childNodes;
      } else if (transpositionsWithGrandChildren.length > 0) {
        // If there are transpositions that have grandchildren, we jump to one of those.
        node = getRandomMove(transpositionsWithGrandChildren, strategy);
        continue;
      } else {
        break;
      }
    }

    // Now, we're free to pick the next move
    const move = getRandomMove(availableMoves, strategy);
    node = move;
    line.moves.push(move);
    turn = turn === "PLAYER" ? "OPPONENT" : "PLAYER";
  }

  return line;
};
