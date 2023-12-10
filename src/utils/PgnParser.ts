import { BLACK, Color, WHITE } from "chess.js";

import { moveResultToMove } from "@/chess/Move";
import { Position } from "@/chess/Position";
import { PositionNode, PositionTree } from "@/chess/PositionTree";
import { Chess, Move as MoveResult } from "chess.js";
import {
  ParsedPGN,
  Comment as PgnComment,
  Header as PgnHeader,
  Move as PgnMove,
  parse,
} from "pgn-parser";
import { Chapter } from "../chess/Chapter";
import { getGameResult } from "../chess/Position";

const convertHeaders = (
  headers: PgnHeader[] | null,
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

const getComments = (comments: PgnComment[] | null): string[] => {
  if (comments) {
    return comments.map((c) => c.text);
  } else {
    return [];
  }
};

const getStudyAndChapter = (headers: {
  [key: string]: string;
}): [string, string] | null => {
  const event = headers.Event;
  if (event) {
    const split = event.split(":");
    if (split.length === 2) {
      return [split[0], split[1]];
    }
  }
  return null;
};

const getOrientation = (headers: { [key: string]: string }): Color | null => {
  const orientation = headers.Orientation;
  if (orientation) {
    if (
      orientation.toLowerCase() == "white" ||
      orientation.toLowerCase() == "w"
    ) {
      return WHITE;
    } else if (
      orientation.toLowerCase() == "black" ||
      orientation.toLowerCase() == "b"
    ) {
      return BLACK;
    } else {
      return null;
    }
  }
  return null;
};

const createChildPositionNodes = (
  moves: PgnMove[],
  chess: Chess,
): PositionNode[] => {
  // Creates and returns a list of Position Nodes
  // consisting of the next move in the main line
  // as well as all the revisions/alternates for that move.

  // First, we initialize a node with the current position.

  // Now, we create the children subtrees from both the
  // main line and its alternates.
  const nodes: PositionNode[] = [];

  // A PgnMove is a set of sibling moves.
  // Given a parent move, these are the children
  // (as well as the recursive children of those moves).

  // Game.move is a list of moves that represent the main line.
  // However, each move can have a list of revisions (ravs).
  // So, a single Move can be thought of as a tree of moves,
  // with the main line as the root and the revisions as the children.
  // The nodes consist of the move (and its children)
  // and the revisions (and their children).

  if (moves.length > 0) {
    // First, we add the main line move.
    const mainLineMove: PgnMove = moves[0];
    const moveResult: MoveResult = chess.move(mainLineMove.move);

    const position: Position = {
      fen: chess.fen(),
      lastMove: moveResultToMove(moveResult),
      comments: mainLineMove.comments,
      isGameOver: chess.isGameOver(),
      gameResult: getGameResult(chess),
    };

    const children = createChildPositionNodes(moves.slice(1), chess);
    chess.undo();

    nodes.push({ position: position, children: children });

    // Then, we add all the revisions for the first move.
    for (const rav of mainLineMove.ravs || []) {
      const alternateMove = rav.moves[0];
      const alternativeMoveResult: MoveResult = chess.move(alternateMove.move);

      const alternatePosition: Position = {
        fen: chess.fen(),
        lastMove: moveResultToMove(alternativeMoveResult),
        comments: alternateMove.comments,
        isGameOver: chess.isGameOver(),
        gameResult: getGameResult(chess),
      };

      const children = createChildPositionNodes(rav.moves.slice(1), chess);
      chess.undo();

      nodes.push({ position: alternatePosition, children: children });
    }
  }

  return nodes;
};

const buildPositionTree = (game: ParsedPGN): PositionTree => {
  const chess = new Chess();
  const rootPosition: PositionTree = {
    position: {
      fen: chess.fen(),
      lastMove: null,
      comments: [],
      isGameOver: false,
    },
    children: createChildPositionNodes(game.moves, chess),
  };

  return rootPosition;
};

export const convertParsedPgnToChapter = (
  game: ParsedPGN,
  chapterIndex: number,
): Chapter => {
  const headers = convertHeaders(game.headers);
  const [studyName, chapterName] = getStudyAndChapter(headers) ?? ["", ""];
  const orientation = getOrientation(headers) ?? WHITE;
  const comments: string[] = getComments(game.comments);
  const positionTree: PositionTree = buildPositionTree(game);

  return {
    name: chapterName.trim(),
    studyName: studyName.trim(),
    chapterIndex: chapterIndex,
    orientation: orientation,
    headers: headers,
    comments: comments,
    positionTree: positionTree,
  };
};

export const parsePgnStringToChapters = (pgn: string): Chapter[] => {
  const parsedGames: ParsedPGN[] = parse(pgn);
  return parsedGames.map(convertParsedPgnToChapter);
};
