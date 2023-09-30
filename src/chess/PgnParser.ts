import {
  parse,
  ParsedPGN,
  Header as PgnHeader,
  Move as PgnMove,
  Comment as PgnComment,
} from "pgn-parser";

import { Chess } from "chess.js";
import { PgnTree, MoveNode, GameResult } from "./PgnTree";

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

const extractComment = (comment: string | PgnComment): string => {
  if (typeof comment === "string") {
    return comment;
  } else {
    return comment.text;
  }
};

const getGameResult = (chess: Chess): GameResult => {
  if (chess.isCheckmate()) {
    return "CHECKMATE";
  } else if (chess.isStalemate()) {
    return "STALEMATE";
  } else if (chess.isInsufficientMaterial()) {
    return "INSUFFICIENT_MATERIAL";
  } else if (chess.isThreefoldRepetition()) {
    return "THREEFOLD_REPETITION";
  } else if (chess.isDraw()) {
    return "DRAW";
  } else {
    return "UNKNOWN";
  }
};

const makeMoveAndChildren = (moves: PgnMove[], chess: Chess): MoveNode => {
  // Get the current player's turn
  const turn = chess.turn();

  // Execute the move on the chess board.
  const firstMove = moves[0];
  const moveResult = chess.move(firstMove.move);

  // Get the child moves.  It important to do this AFTER we call chess.move(...)
  // above so the board is up-to-date.
  const childMoves = convertMovesToTree(moves.slice(1), chess);

  const mainLineMove: MoveNode = {
    move: firstMove.move,
    piece: moveResult.piece,
    from: moveResult.from,
    to: moveResult.to,
    children: childMoves,
    player: turn,
    fen: chess.fen(),
    isGameOver: chess.isGameOver(),
  };

  if (chess.isGameOver()) {
    mainLineMove.gameResult = getGameResult(chess);
  }

  if (firstMove.comments.length > 0) {
    mainLineMove.comments = firstMove.comments.map(extractComment);
  }

  // Undo the move
  chess.undo();

  return mainLineMove;
};

const convertMovesToTree = (moves: PgnMove[], chess: Chess): MoveNode[] => {
  // A PgnMove is a set of sibling moves.
  // Given a parent move, these are the children
  // (as well as the recursive children of those moves).

  if (moves.length === 0) {
    return [];
  }
  // The nodes consist of the move (and its children)
  // and the revisions (and their children).

  const moveNodes: MoveNode[] = [];

  // First, we add the main line move.
  moveNodes.push(makeMoveAndChildren(moves, chess));

  // Then, we add all the revisions for the first move.
  if (moves[0].ravs) {
    for (const rav of moves[0].ravs) {
      moveNodes.push(makeMoveAndChildren(rav.moves, chess));
    }
  }

  return moveNodes;
};

export const convertGameToTree = (game: ParsedPGN): PgnTree => {
  const headers = convertHeaders(game.headers);
  const study = headers.Event.split(":")[0];
  const chapter = headers.Event.split(":")[1];
  const orientation = headers.Orientation.toLowerCase() == "white" ? "w" : "b";
  return {
    study: study,
    chapter: chapter,
    headers: headers,
    orientation: orientation,
    moveTree: convertMovesToTree(game.moves, new Chess()),
  };
};

export const parsePgnString = (pgn: string): PgnTree[] => {
  const parsedGames = parse(pgn);
  return parsedGames.map(convertGameToTree);
};
