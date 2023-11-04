import { Color, WHITE, BLACK, Move } from "chess.js";

import {
  parse,
  ParsedPGN,
  Header as PgnHeader,
  Move as PgnMove,
  Comment as PgnComment,
} from "pgn-parser";
import { Chess } from "chess.js";
import { Chapter, PositionNode } from "../chess/Chapter";
import { GameResult } from "../chess/Position";
import { Position } from "@/chess/Position";

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

const getComments = (comments: PgnComment[] | null): string[] => {
  if (comments) {
    return comments.map((c) => c.text);
  } else {
    return [];
  }
};
/*
const extractComment = (comment: string | PgnComment): string => {
  if (typeof comment === "string") {
    return comment;
  } else {
    return comment.text;
  }
};
*/
export const getGameResult = (chess: Chess): GameResult => {
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

/*
const makePosition = (chess: Chess): Position => {
  const fen = chess.fen();
  const lastMove = chess.history({ verbose: true }).slice(-1)[0];
  const comments = chess.comments();
  const isGameOver = chess.isGameOver();
  const gameResult = getGameResult(chess);

  return {
    fen: fen,
    lastMove: lastMove,
    comments: comments,
    isGameOver: isGameOver,
    gameResult: gameResult,
  };
}



const makeMove(move: PgnMove, chess: Chess): Move => {

  const turn = chess.turn();
  const gameResult = getGameResult(chess);
  const fen = chess.fen();
  const isGameOver = chess.isGameOver();


  return {
    move: move.move,
    piece: moveResult.piece,
    from: moveResult.from,
    to: moveResult.to,
    promotion: moveResult.promotion,
    player: turn,
    fen: fen,
    isGameOver: isGameOver,
    gameResult: gameResult,
  };
}
*/

/*
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
    promotion: moveResult.promotion,
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
*/
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
  chess: Chess
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
    const moveResult: Move = chess.move(mainLineMove.move);

    const position: Position = {
      fen: chess.fen(),
      lastMove: moveResult,
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
      const alternativeMoveResult = chess.move(alternateMove.move);

      const alternatePosition: Position = {
        fen: chess.fen(),
        lastMove: alternativeMoveResult,
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

export const convertParsedPgnToChapter = (game: ParsedPGN): Chapter => {
  const headers = convertHeaders(game.headers);
  const [study, chapter] = getStudyAndChapter(headers) ?? ["", ""];
  const orientation = getOrientation(headers) ?? WHITE;

  const topLevelComments: string[] = getComments(game.comments);

  const chess = new Chess();
  const rootPosition: PositionNode = {
    position: {
      fen: chess.fen(),
      lastMove: null,
      comments: topLevelComments,
      isGameOver: false,
    },
    children: createChildPositionNodes(game.moves, chess),
  };

  //const positionTree =

  return {
    name: chapter,
    studyName: study,
    orientation: orientation,
    headers: headers,
    positionTree: rootPosition,
    //    positionTree: { children: convertMovesToTree(game.moves, new Chess()) },
  };
};

export const parsePgnStringToChapters = (pgn: string): Chapter[] => {
  const parsedGames = parse(pgn);
  return parsedGames.map(convertParsedPgnToChapter);
};
