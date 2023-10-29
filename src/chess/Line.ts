import { Chapter, MoveNode, Node } from "./Chapter";
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

const getRandomMove = (node: Node): MoveNode => {
  const children = node.children;
  const randomIndex = Math.floor(Math.random() * children.length);
  return children[randomIndex];
};

export const pickLine = (chapters: Chapter[]): Line => {
  // First, pick a chapter at random
  const chapter = chapters[Math.floor(Math.random() * chapters.length)];

  const line: Line = {
    chapter,
    moves: [],
  };

  var node: Node = chapter.moveTree;

  const orientation = chapter.orientation;

  if (orientation === "w") {
    const firstMove = getRandomMove(node);
    node = firstMove;
    line.moves.push(firstMove);
  }

  // Line is over if either if either it has no children
  // or if any of the children have no children.
  // (Why "if any of the children have no children"?  Because
  // we want to avoid lines that end on the opponent's move).
  const isLineOver = (node: Node): boolean => {
    return (
      node.children.length == 0 ||
      node.children.some((child) => child.children.length == 0)
    );
  };

  while (!isLineOver(node)) {
    // First, pick an opponent's move
    const opponentMove = getRandomMove(node);
    node = opponentMove;
    line.moves.push(opponentMove);

    if (node.children.length === 0) {
      throw new Error("Unexpected end of line");
    }

    // Then, pick the player's next move
    const playerMove = getRandomMove(node);
    node = playerMove;
    line.moves.push(playerMove);
  }

  return line;
};
