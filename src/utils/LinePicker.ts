import { Chapter, PositionNode as Node } from "@/chess/Chapter";
import { Fen } from "@/chess/Fen";
import { Line } from "@/chess/Line";
import { Color } from "chess.js";

export type MoveSelectionStrategy =
  | "DETERMINISTIC"
  | "RANDOM"
  | "LINE_WEIGHTED"
  | "DATABASE_WEIGHTED";

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

export const lineToSan = (line: Line): string[] => {
  return line.positions
    .filter((position) => position.lastMove != null)
    .map((position) => position.lastMove?.san ?? "");
};

const getRandomMove = (
  nodes: Node[],
  strategy: MoveSelectionStrategy,
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
    const linesPerChapter = chapters.map((chapter) =>
      getNumberOfLines(chapter.positionTree),
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
  positionIndex: Map<Fen, Node[]>,
): Node[] => {
  const fen: Fen = node.position.fen;

  const transpositions = positionIndex.get(fen);

  if (transpositions === undefined) {
    return [];
  } else {
    return transpositions.filter((n) => n !== node);
  }
};

export const pickLine = (
  chapters: Chapter[],
  strategy: MoveSelectionStrategy,
): Line => {
  // First, pick a chapter at random
  const chapter = selectChapter(chapters, strategy);

  const orientation: Color = chapter.orientation;

  var turn: "PLAYER" | "OPPONENT" = orientation === "w" ? "PLAYER" : "OPPONENT";

  var node: Node = chapter.positionTree;

  const positionIndex = createPositionIndex(node);

  const line: Line = {
    chapter,
    positions: [node.position],
  };

  while (true) {
    var availableMoves = [];

    if (turn === "PLAYER") {
      const transpositions = getTranspositions(node, positionIndex).filter(
        (n) => n.children.length > 0,
      );

      // There should be a single move for the player to make. We don't yet
      // support multiple lines (or alternate moves) for the player.
      if (node.children.length > 1) {
        console.error(
          "Multiple moves not implemented.  Encountered at line: " +
            lineToSan(line),
        );
        availableMoves = [node.children[0]];
      } else if (node.children.length == 1) {
        availableMoves = node.children;
      } else {
        if (transpositions.length > 0) {
          // If there are transpositions that have children, we jump to one of those
          // and continue with the line.
          node = getRandomMove(transpositions, strategy);
          continue;
        } else {
          throw new Error(
            "No moves available.  Encountered at line: " + lineToSan(line),
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

      const transpositions = getTranspositions(node, positionIndex).filter(
        (n) => n.children.length > 0 && n.children.some(hasChild),
      );

      const childNodes = node.children.filter(hasChild);

      if (childNodes.length > 0) {
        availableMoves = childNodes;
      } else if (transpositions.length > 0) {
        // If there are transpositions that have grandchildren, we jump to one of those.
        node = getRandomMove(transpositions, strategy);
        continue;
      } else {
        break;
      }
    }

    // Now, we're free to pick the next move
    const move: Node = getRandomMove(availableMoves, strategy);
    node = move;
    line.positions.push(move.position);
    turn = turn === "PLAYER" ? "OPPONENT" : "PLAYER";
  }

  return line;
};
