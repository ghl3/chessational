import { Line } from "@/chess/Line";
//import { Chapter, PositionNode as Node } from "@/chess/Chapter";
import { PositionTree, PositionNode as Node } from "@/chess/PositionTree";
import { Fen } from "@/chess/Fen";
import { Position } from "@/chess/Position";
import { Color } from "chess.js";

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

const getAllMoveLists = (
  node: Node,
  currentLine: Position[],
  isPlayerMove: boolean,
  positionIndex: Map<Fen, Node[]>,
): Position[][] => {
  if (node.children.length === 0) {
    // If there are transpositions with children, iterate through them
    const transpositions = getTranspositions(node, positionIndex).filter(
      (t) => t.children.length > 0,
    );

    if (transpositions.length > 0) {
      return transpositions.flatMap((transposition) => {
        return getAllMoveLists(
          transposition,
          currentLine,
          !isPlayerMove,
          positionIndex,
        );
      });
    } else {
      // Otherwise, terminate the line
      return [currentLine];
    }
  } else if (isPlayerMove) {
    // If there are multiple moves for the player,
    // for now, just pick the first one
    const child = node.children[0];
    const nextLine: Position[] = [...currentLine, child.position];
    return getAllMoveLists(child, nextLine, !isPlayerMove, positionIndex);
  } else {
    return node.children.flatMap((child) => {
      const nextLine: Position[] = [...currentLine, child.position];
      return getAllMoveLists(child, nextLine, !isPlayerMove, positionIndex);
    });
  }
};

export const getAllLines = (tree: PositionTree, orientation: Color): Line[] => {
  var node: Node = tree;

  const playerHasFirstMove = orientation === "w";

  const moveLists: Position[][] = getAllMoveLists(
    node,
    [node.position],
    playerHasFirstMove,
    createPositionIndex(node),
  );

  return moveLists;
};

export const getLinesForPlayer = (
  tree: PositionTree,
  orientation: Color,
): Line[] => {
  // Get all non-empty lines
  const allLines = getAllLines(tree, orientation);

  const filteredLines = allLines.filter((line) => {
    return line.length > 0;
  });

  // TODO: Filter lines that have multiple player moves
  // Ensure all lines end with the player's move (dropping the last move if needed)
  const lines = filteredLines.map((line) => {
    const lastPosition = line[line.length - 1];
    const lastMove = lastPosition.lastMove;

    if (lastMove && lastMove.player === orientation) {
      return line;
    } else {
      return line.slice(0, line.length - 1);
    }
  });

  return lines;
};
