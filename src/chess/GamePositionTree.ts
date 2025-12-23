import { Position, createPosition } from "./Position";
import { Move, moveResultToMove } from "./Move";
import { ChessComGame, GameResultString } from "./ChessComGame";
import { Chess, Color, WHITE, BLACK, Move as MoveResult } from "chess.js";
import { parse, ParsedPGN } from "pgn-parser";
import { Fen, normalizeFen } from "./Fen";

/**
 * Statistics for a single node in the game tree
 */
export interface GameStats {
  gameCount: number;
  wins: number;
  draws: number;
  losses: number;
}

/**
 * A node in the game position tree, extending basic position data
 * with game statistics
 */
export interface GamePositionNode {
  position: Position;
  children: GamePositionNode[];
  // Game statistics for this position
  stats: GameStats;
  // Whether this position exists in the user's repertoire
  inRepertoire: boolean;
  // The move that led to this position (for easier lookup)
  move: Move | null;
}

export type GamePositionTree = GamePositionNode;

/**
 * Create empty game statistics
 */
const createEmptyStats = (): GameStats => ({
  gameCount: 0,
  wins: 0,
  draws: 0,
  losses: 0,
});

/**
 * Create the root node of a game position tree
 */
export const createRootNode = (): GamePositionTree => {
  const chess = new Chess();
  return {
    position: {
      fen: chess.fen(),
      lastMove: null,
      comments: [],
      isGameOver: false,
    },
    children: [],
    stats: createEmptyStats(),
    inRepertoire: false,
    move: null,
  };
};

/**
 * Find a child node by FEN (position after move)
 */
const findChildByFen = (
  node: GamePositionNode,
  fen: Fen
): GamePositionNode | undefined => {
  return node.children.find((child) => child.position.fen === fen);
};

/**
 * Add a game's moves to the tree, updating statistics along the way
 */
const addGameToTree = (
  root: GamePositionTree,
  pgn: string,
  result: GameResultString,
  playerColor: Color
): void => {
  // Parse the PGN
  let parsedGames: ParsedPGN[];
  try {
    parsedGames = parse(pgn);
  } catch (error) {
    console.warn("Failed to parse PGN:", error);
    return;
  }

  if (parsedGames.length === 0 || !parsedGames[0].moves) {
    return;
  }

  const moves = parsedGames[0].moves;
  const chess = new Chess();
  let currentNode = root;

  // Update root stats
  currentNode.stats.gameCount++;
  if (result === "win") {
    currentNode.stats.wins++;
  } else if (result === "loss") {
    currentNode.stats.losses++;
  } else {
    currentNode.stats.draws++;
  }

  // Process each move in the game
  for (const pgnMove of moves) {
    // Make the move
    let moveResult: MoveResult;
    try {
      moveResult = chess.move(pgnMove.move);
    } catch (error) {
      console.warn("Invalid move in PGN:", pgnMove.move, error);
      break;
    }

    const newFen = chess.fen();

    // Look for existing child with this position
    let childNode = findChildByFen(currentNode, newFen);

    if (!childNode) {
      // Create new child node
      const move = moveResultToMove(moveResult);
      childNode = {
        position: createPosition(move, chess),
        children: [],
        stats: createEmptyStats(),
        inRepertoire: false,
        move: move,
      };
      currentNode.children.push(childNode);
    }

    // Update child's statistics
    childNode.stats.gameCount++;
    if (result === "win") {
      childNode.stats.wins++;
    } else if (result === "loss") {
      childNode.stats.losses++;
    } else {
      childNode.stats.draws++;
    }

    currentNode = childNode;
  }
};

/**
 * Build a game position tree from a list of Chess.com games
 */
export const buildGamePositionTree = (
  games: ChessComGame[]
): GamePositionTree => {
  const root = createRootNode();

  for (const game of games) {
    addGameToTree(root, game.pgn, game.result, game.color);
  }

  return root;
};

/**
 * Get all moves available at a given position in the tree
 */
export const getMovesAtPosition = (
  tree: GamePositionTree,
  fen: Fen
): GamePositionNode[] => {
  // Find the node with this FEN
  const node = findNodeByFen(tree, fen);
  if (!node) {
    return [];
  }
  return node.children;
};

/**
 * Find a node in the tree by FEN
 */
export const findNodeByFen = (
  node: GamePositionNode,
  fen: Fen
): GamePositionNode | null => {
  if (normalizeFen(node.position.fen) === normalizeFen(fen)) {
    return node;
  }

  for (const child of node.children) {
    const found = findNodeByFen(child, fen);
    if (found) {
      return found;
    }
  }

  return null;
};

/**
 * Find the path (array of nodes) from root to a given FEN
 * Returns empty array if FEN not found
 */
export const findPathToFen = (
  root: GamePositionNode,
  targetFen: Fen
): GamePositionNode[] => {
  const normalizedTarget = normalizeFen(targetFen);

  const search = (node: GamePositionNode, path: GamePositionNode[]): GamePositionNode[] | null => {
    const currentPath = [...path, node];

    if (normalizeFen(node.position.fen) === normalizedTarget) {
      return currentPath;
    }

    for (const child of node.children) {
      const found = search(child, currentPath);
      if (found) {
        return found;
      }
    }

    return null;
  };

  return search(root, []) || [];
};

/**
 * Get the most common child node (by game count)
 */
export const getMostCommonChild = (node: GamePositionNode): GamePositionNode | null => {
  if (node.children.length === 0) {
    return null;
  }
  return node.children.reduce((best, child) =>
    child.stats.gameCount > best.stats.gameCount ? child : best
  );
};

/**
 * Calculate win percentage for a node
 */
export const getWinPercentage = (stats: GameStats): number => {
  if (stats.gameCount === 0) return 0;
  return (stats.wins / stats.gameCount) * 100;
};

/**
 * Calculate draw percentage for a node
 */
export const getDrawPercentage = (stats: GameStats): number => {
  if (stats.gameCount === 0) return 0;
  return (stats.draws / stats.gameCount) * 100;
};

/**
 * Calculate loss percentage for a node
 */
export const getLossPercentage = (stats: GameStats): number => {
  if (stats.gameCount === 0) return 0;
  return (stats.losses / stats.gameCount) * 100;
};

/**
 * Get the move frequency as a percentage of total games at the parent position
 */
export const getMoveFrequency = (
  childStats: GameStats,
  parentStats: GameStats
): number => {
  if (parentStats.gameCount === 0) return 0;
  return (childStats.gameCount / parentStats.gameCount) * 100;
};

/**
 * Sort children by game count (most played first)
 */
export const sortByPopularity = (
  children: GamePositionNode[]
): GamePositionNode[] => {
  return [...children].sort((a, b) => b.stats.gameCount - a.stats.gameCount);
};

/**
 * Sort children by win rate (highest first)
 */
export const sortByWinRate = (
  children: GamePositionNode[]
): GamePositionNode[] => {
  return [...children].sort((a, b) => {
    const aWinRate = getWinPercentage(a.stats);
    const bWinRate = getWinPercentage(b.stats);
    return bWinRate - aWinRate;
  });
};

