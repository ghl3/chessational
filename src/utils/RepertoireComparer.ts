import { GamePositionNode, GamePositionTree, GameStats } from "@/chess/GamePositionTree";
import { PositionNode, PositionTree } from "@/chess/PositionTree";
import { Fen } from "@/chess/Fen";
import { Move } from "@/chess/Move";
import { Color, WHITE, BLACK } from "chess.js";

/**
 * A deviation from the repertoire
 */
export interface Deviation {
  // The FEN position where the deviation occurred
  fen: Fen;
  // The move that was played (deviating from repertoire)
  playedMove: Move;
  // Expected moves from the repertoire (if any)
  expectedMoves: Move[];
  // Who deviated: "player" or "opponent"
  deviatedBy: "player" | "opponent";
  // Statistics for the played move
  stats: GameStats;
  // How many times this deviation occurred
  occurrences: number;
  // Move number (half-move)
  moveNumber: number;
}

/**
 * Result of comparing games to repertoire
 */
export interface ComparisonResult {
  // All deviations found
  deviations: Deviation[];
  // The game tree with inRepertoire flags set
  markedTree: GamePositionTree;
  // Summary statistics
  summary: {
    totalGames: number;
    gamesWithDeviations: number;
    playerDeviations: number;
    opponentDeviations: number;
    mostCommonDeviation: Deviation | null;
  };
}

/**
 * Normalize FEN for comparison (ignore move counts)
 */
const normalizeFen = (fen: Fen): string => {
  const parts = fen.split(" ");
  return parts.slice(0, 4).join(" ");
};

/**
 * Find a position in the repertoire tree by FEN
 */
const findInRepertoire = (
  node: PositionNode,
  fen: Fen
): PositionNode | null => {
  if (normalizeFen(node.position.fen) === normalizeFen(fen)) {
    return node;
  }

  for (const child of node.children) {
    const found = findInRepertoire(child, fen);
    if (found) {
      return found;
    }
  }

  return null;
};

/**
 * Check if a move exists in the repertoire at a given position
 */
const isMoveInRepertoire = (
  repertoireNode: PositionNode,
  move: Move
): boolean => {
  return repertoireNode.children.some(
    (child) =>
      child.position.lastMove?.san === move.san ||
      (child.position.lastMove?.from === move.from &&
        child.position.lastMove?.to === move.to)
  );
};

/**
 * Get expected moves from repertoire at a position
 */
const getExpectedMoves = (repertoireNode: PositionNode): Move[] => {
  return repertoireNode.children
    .map((child) => child.position.lastMove)
    .filter((move): move is Move => move !== null);
};

/**
 * Determine who deviated based on move number
 * Player deviates on their own moves, opponent deviates on their moves
 */
const getDeviator = (
  moveNumber: number,
  playerColor: Color
): "player" | "opponent" => {
  // Move number is half-moves (0 = before first move, 1 = after white's first, etc.)
  // White moves on odd half-moves (1, 3, 5...)
  // Black moves on even half-moves (2, 4, 6...)
  const isWhiteMove = moveNumber % 2 === 1;
  const playerIsWhite = playerColor === WHITE;

  if ((isWhiteMove && playerIsWhite) || (!isWhiteMove && !playerIsWhite)) {
    return "player";
  }
  return "opponent";
};

/**
 * Walk the game tree and compare to repertoire, marking nodes and collecting deviations
 */
const walkAndCompare = (
  gameNode: GamePositionNode,
  repertoireTree: PositionTree,
  playerColor: Color,
  deviations: Map<string, Deviation>,
  moveNumber: number
): void => {
  // Find this position in the repertoire
  const repertoireNode = findInRepertoire(repertoireTree, gameNode.position.fen);
  gameNode.inRepertoire = repertoireNode !== null;

  // Process children
  for (const child of gameNode.children) {
    if (child.move === null) continue;

    // Check if this move exists in the repertoire
    let isInRepertoire = false;
    if (repertoireNode) {
      isInRepertoire = isMoveInRepertoire(repertoireNode, child.move);
    }

    child.inRepertoire = isInRepertoire;

    // If not in repertoire and repertoire has expected moves, record deviation
    if (!isInRepertoire && repertoireNode && repertoireNode.children.length > 0) {
      const deviationKey = `${normalizeFen(gameNode.position.fen)}-${child.move.san}`;
      const existingDeviation = deviations.get(deviationKey);

      if (existingDeviation) {
        existingDeviation.occurrences += child.stats.gameCount;
        existingDeviation.stats.gameCount += child.stats.gameCount;
        existingDeviation.stats.wins += child.stats.wins;
        existingDeviation.stats.draws += child.stats.draws;
        existingDeviation.stats.losses += child.stats.losses;
      } else {
        deviations.set(deviationKey, {
          fen: gameNode.position.fen,
          playedMove: child.move,
          expectedMoves: getExpectedMoves(repertoireNode),
          deviatedBy: getDeviator(moveNumber + 1, playerColor),
          stats: { ...child.stats },
          occurrences: child.stats.gameCount,
          moveNumber: moveNumber + 1,
        });
      }
    }

    // Recursively process child
    walkAndCompare(child, repertoireTree, playerColor, deviations, moveNumber + 1);
  }
};

/**
 * Compare a game position tree against a repertoire tree
 */
export const compareToRepertoire = (
  gameTree: GamePositionTree,
  repertoireTree: PositionTree,
  playerColor: Color
): ComparisonResult => {
  const deviations = new Map<string, Deviation>();

  // Walk the tree and collect deviations
  walkAndCompare(gameTree, repertoireTree, playerColor, deviations, 0);

  // Convert to array and sort by occurrences
  const deviationArray = Array.from(deviations.values()).sort(
    (a, b) => b.occurrences - a.occurrences
  );

  // Count player vs opponent deviations
  const playerDeviations = deviationArray.filter(
    (d) => d.deviatedBy === "player"
  );
  const opponentDeviations = deviationArray.filter(
    (d) => d.deviatedBy === "opponent"
  );

  // Count games with deviations (approximate - based on root stats and deviation occurrences)
  const totalDeviationOccurrences = deviationArray.reduce(
    (sum, d) => sum + d.occurrences,
    0
  );

  return {
    deviations: deviationArray,
    markedTree: gameTree,
    summary: {
      totalGames: gameTree.stats.gameCount,
      gamesWithDeviations: Math.min(
        totalDeviationOccurrences,
        gameTree.stats.gameCount
      ),
      playerDeviations: playerDeviations.reduce((sum, d) => sum + d.occurrences, 0),
      opponentDeviations: opponentDeviations.reduce(
        (sum, d) => sum + d.occurrences,
        0
      ),
      mostCommonDeviation: deviationArray.length > 0 ? deviationArray[0] : null,
    },
  };
};

/**
 * Check if a move is covered by ANY of the repertoire trees
 */
const isMoveInAnyRepertoire = (
  gameFen: Fen,
  move: Move,
  repertoireTrees: PositionTree[]
): boolean => {
  for (const tree of repertoireTrees) {
    const repertoireNode = findInRepertoire(tree, gameFen);
    if (repertoireNode && isMoveInRepertoire(repertoireNode, move)) {
      return true;
    }
  }
  return false;
};

/**
 * Get all expected moves from all repertoire trees at a position
 */
const getAllExpectedMoves = (
  gameFen: Fen,
  repertoireTrees: PositionTree[]
): Move[] => {
  const movesMap = new Map<string, Move>();
  
  for (const tree of repertoireTrees) {
    const repertoireNode = findInRepertoire(tree, gameFen);
    if (repertoireNode) {
      for (const move of getExpectedMoves(repertoireNode)) {
        const key = `${move.from}-${move.to}`;
        if (!movesMap.has(key)) {
          movesMap.set(key, move);
        }
      }
    }
  }
  
  return Array.from(movesMap.values());
};

/**
 * Check if position exists in any repertoire tree
 */
const isPositionInAnyRepertoire = (
  fen: Fen,
  repertoireTrees: PositionTree[]
): boolean => {
  for (const tree of repertoireTrees) {
    if (findInRepertoire(tree, fen)) {
      return true;
    }
  }
  return false;
};

/**
 * Walk the game tree comparing against ALL repertoire trees together
 */
const walkAndCompareMultiple = (
  gameNode: GamePositionNode,
  repertoireTrees: PositionTree[],
  playerColor: Color,
  deviations: Map<string, Deviation>,
  moveNumber: number
): void => {
  // Check if this position exists in any repertoire
  const inAnyRepertoire = isPositionInAnyRepertoire(gameNode.position.fen, repertoireTrees);
  gameNode.inRepertoire = inAnyRepertoire;

  // Process children
  for (const child of gameNode.children) {
    if (child.move === null) continue;

    // Check if this move exists in ANY repertoire
    const isInRepertoire = isMoveInAnyRepertoire(
      gameNode.position.fen,
      child.move,
      repertoireTrees
    );

    // TRANSPOSITION CHECK: Even if the move isn't explicitly in the repertoire,
    // the resulting position might transpose into a position that IS covered.
    // If the child's position exists in any repertoire, it's a transposition - not a gap.
    const resultingPositionInRepertoire = isPositionInAnyRepertoire(
      child.position.fen,
      repertoireTrees
    );

    // Mark as in repertoire if either the move is there OR it transposes to a known position
    child.inRepertoire = isInRepertoire || resultingPositionInRepertoire;

    // Get expected moves from ALL repertoires
    const expectedMoves = getAllExpectedMoves(gameNode.position.fen, repertoireTrees);

    // Only record as deviation if:
    // 1. Move not explicitly in repertoire at this position
    // 2. Current position is in repertoire (we have expectations)
    // 3. There are expected moves
    // 4. The resulting position does NOT transpose to a known position
    if (!isInRepertoire && inAnyRepertoire && expectedMoves.length > 0 && !resultingPositionInRepertoire) {
      const deviationKey = `${normalizeFen(gameNode.position.fen)}-${child.move.san}`;
      const existingDeviation = deviations.get(deviationKey);

      if (existingDeviation) {
        existingDeviation.occurrences += child.stats.gameCount;
        existingDeviation.stats.gameCount += child.stats.gameCount;
        existingDeviation.stats.wins += child.stats.wins;
        existingDeviation.stats.draws += child.stats.draws;
        existingDeviation.stats.losses += child.stats.losses;
      } else {
        deviations.set(deviationKey, {
          fen: gameNode.position.fen,
          playedMove: child.move,
          expectedMoves: expectedMoves,
          deviatedBy: getDeviator(moveNumber + 1, playerColor),
          stats: { ...child.stats },
          occurrences: child.stats.gameCount,
          moveNumber: moveNumber + 1,
        });
      }
    }

    // Recurse into children
    walkAndCompareMultiple(
      child,
      repertoireTrees,
      playerColor,
      deviations,
      moveNumber + 1
    );
  }
};

/**
 * Compare against multiple repertoire chapters - a move is only a deviation
 * if it's NOT covered by ANY chapter
 */
export const compareToRepertoireChapters = (
  gameTree: GamePositionTree,
  repertoireTrees: PositionTree[],
  playerColor: Color
): ComparisonResult => {
  const deviations = new Map<string, Deviation>();
  
  // Walk the game tree comparing against ALL repertoires together
  walkAndCompareMultiple(gameTree, repertoireTrees, playerColor, deviations, 0);

  // Convert to array and sort by occurrences
  const deviationArray = Array.from(deviations.values()).sort(
    (a, b) => b.occurrences - a.occurrences
  );

  // Calculate summary
  const playerDeviations = deviationArray.filter((d) => d.deviatedBy === "player");
  const opponentDeviations = deviationArray.filter((d) => d.deviatedBy === "opponent");
  const totalDeviationOccurrences = deviationArray.reduce(
    (sum, d) => sum + d.occurrences,
    0
  );

  return {
    deviations: deviationArray,
    markedTree: gameTree,
    summary: {
      totalGames: gameTree.stats.gameCount,
      gamesWithDeviations: Math.min(
        totalDeviationOccurrences,
        gameTree.stats.gameCount
      ),
      playerDeviations: playerDeviations.reduce((sum, d) => sum + d.occurrences, 0),
      opponentDeviations: opponentDeviations.reduce(
        (sum, d) => sum + d.occurrences,
        0
      ),
      mostCommonDeviation: deviationArray.length > 0 ? deviationArray[0] : null,
    },
  };
};

