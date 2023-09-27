import {
  parse,
  ParsedPGN,
  Header as PgnHeader,
  Move as PgnMove,
} from "pgn-parser";

// Remove the following line since ParsedPGN is already imported above
// import { ParsedPGN } from "pgn-parser";
import { PgnTree, MoveNode } from "./PgnTree";

const convertHeaders = (
  headers: PgnHeader[] | null
): { [key: string]: string } => {
  if (headers) {
    const res: { [key: string]: string } = {};
    for (const header of headers) {
      res[header.name] = header.value;
    }
    return res;
  } else {
    return {};
  }
};

const makeMoveAndChildren = (moves: PgnMove[]): MoveNode => {
  const firstMove = moves[0];
  const childMoves = convertMovesToTree(moves.slice(1));

  const mainLineMove: MoveNode = {
    move: firstMove.move,
    children: childMoves,
  };

  if (firstMove.comments.length > 0) {
    mainLineMove.comments = firstMove.comments;
  }

  return mainLineMove;
};

const convertMovesToTree = (moves: PgnMove[]): MoveNode[] => {
  // A PgnMove is a set of sibling moves.
  // Given a parent move, these are the children
  // (as well as the recursive children of those moves).

  if (moves.length === 0) {
    return [];
  }
  // The nodes consist of the move (and its children)
  // and the revisions (and their children);

  const moveNodes: MoveNode[] = [];

  // First, we create the main line move
  moveNodes.push(makeMoveAndChildren(moves));
  /*
  const mainMove = moves[0];

  const mainLineMove: MoveNode = {
    move: mainMove.move,
    comments: mainMove.comments.length > 0 ? mainMove.comments : undefined,
    children: convertMovesToTree(moves.slice(1)),
  };
  moveNodes.push(mainLineMove);
*/
  // Then, we add all the revisions
  if (moves[0].ravs) {
    for (const rav of moves[0].ravs) {
      moveNodes.push(makeMoveAndChildren(rav.moves));

      /*
      const firstMove = rav.moves[0];

      moveNodes.push({
        move: firstMove.move,
        comments:
          firstMove.comments.length > 0 ? firstMove.comments : undefined,
        children: convertMovesToTree(rav.moves.slice(1)),
      });
      */
    }
  }

  return moveNodes;
};

export const convertGameToTree = (game: ParsedPGN): PgnTree => {
  return {
    headers: convertHeaders(game.headers),
    moveTree: convertMovesToTree(game.moves),
    perspective: "w",
  };
};

export const parsePgnString = (pgn: string): PgnTree[] => {
  const parsedGames = parse(pgn);
  return parsedGames.map(convertGameToTree);
};
