"use client";

import { useState, useCallback, useMemo } from "react";
import { ChessComGame } from "@/chess/ChessComGame";
import {
  GamePositionTree,
  GamePositionNode,
  buildGamePositionTree,
  findNodeByFen,
  createRootNode,
} from "@/chess/GamePositionTree";
import { fetchChessComGames } from "@/utils/ChessComFetcher";
import {
  compareToRepertoireChapters,
  ComparisonResult,
  Deviation,
} from "@/utils/RepertoireComparer";
import { PositionTree } from "@/chess/PositionTree";
import { Fen } from "@/chess/Fen";
import { Color, WHITE, BLACK } from "chess.js";
import { Chapter } from "@/chess/Chapter";

export interface GameReviewConfig {
  username: string;
  startDate: Date;
  endDate: Date;
  timeClasses: string[];
}

export interface GameReviewState {
  // Configuration
  config: GameReviewConfig | null;
  setConfig: (config: GameReviewConfig) => void;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Data - all games (both colors)
  games: ChessComGame[];
  whiteGames: ChessComGame[];
  blackGames: ChessComGame[];
  
  // Separate trees for each color
  whiteGameTree: GamePositionTree;
  blackGameTree: GamePositionTree;
  
  // Current color for Moves tab navigation
  currentColor: Color;
  setCurrentColor: (color: Color) => void;
  
  // Current game tree (based on currentColor)
  gameTree: GamePositionTree;
  
  // Combined comparison result (both colors)
  comparisonResult: ComparisonResult | null;

  // Current position in the tree
  currentNode: GamePositionNode | null;
  currentFen: Fen;

  // Selected deviation
  selectedDeviation: Deviation | null;
  setSelectedDeviation: (deviation: Deviation | null) => void;

  // Actions
  loadGames: (config: GameReviewConfig) => Promise<void>;
  compareToRepertoire: (chapters: Chapter[]) => void;
  navigateToPosition: (fen: Fen) => void;
  navigateToNode: (node: GamePositionNode) => void;
  reset: () => void;
}

const INITIAL_FEN: Fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Combine two comparison results into one
 */
const combineComparisonResults = (
  whiteResult: ComparisonResult | null,
  blackResult: ComparisonResult | null
): ComparisonResult | null => {
  if (!whiteResult && !blackResult) return null;
  if (!whiteResult) return blackResult;
  if (!blackResult) return whiteResult;

  // Combine deviations from both results
  const allDeviations = [...whiteResult.deviations, ...blackResult.deviations];
  
  // Sort by occurrences
  allDeviations.sort((a, b) => b.occurrences - a.occurrences);

  return {
    deviations: allDeviations,
    markedTree: whiteResult.markedTree, // We'll use the white tree as reference (not really used in combined view)
    summary: {
      totalGames: whiteResult.summary.totalGames + blackResult.summary.totalGames,
      gamesWithDeviations: whiteResult.summary.gamesWithDeviations + blackResult.summary.gamesWithDeviations,
      playerDeviations: whiteResult.summary.playerDeviations + blackResult.summary.playerDeviations,
      opponentDeviations: whiteResult.summary.opponentDeviations + blackResult.summary.opponentDeviations,
      mostCommonDeviation: allDeviations.length > 0 ? allDeviations[0] : null,
    },
  };
};

export const useGameReviewState = (): GameReviewState => {
  // Configuration
  const [config, setConfig] = useState<GameReviewConfig | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data - all games
  const [games, setGames] = useState<ChessComGame[]>([]);
  
  // Separate trees for each color
  const [whiteGameTree, setWhiteGameTree] = useState<GamePositionTree>(createRootNode());
  const [blackGameTree, setBlackGameTree] = useState<GamePositionTree>(createRootNode());
  
  // Current color for Moves tab
  const [currentColor, setCurrentColor] = useState<Color>(WHITE);
  
  // Separate comparison results
  const [whiteComparisonResult, setWhiteComparisonResult] = useState<ComparisonResult | null>(null);
  const [blackComparisonResult, setBlackComparisonResult] = useState<ComparisonResult | null>(null);

  // Navigation
  const [currentFen, setCurrentFen] = useState<Fen>(INITIAL_FEN);
  const [selectedDeviation, setSelectedDeviation] = useState<Deviation | null>(null);

  // Derived state: games filtered by color
  const whiteGames = useMemo(() => games.filter(g => g.color === WHITE), [games]);
  const blackGames = useMemo(() => games.filter(g => g.color === BLACK), [games]);

  // Current game tree based on selected color
  const gameTree = useMemo(() => {
    return currentColor === WHITE ? whiteGameTree : blackGameTree;
  }, [currentColor, whiteGameTree, blackGameTree]);

  // Combined comparison result for Deviations/Gaps tabs
  const comparisonResult = useMemo(() => {
    return combineComparisonResults(whiteComparisonResult, blackComparisonResult);
  }, [whiteComparisonResult, blackComparisonResult]);

  // Computed current node (based on current color's tree)
  const currentNode = useMemo(() => {
    return findNodeByFen(gameTree, currentFen);
  }, [gameTree, currentFen]);

  // Load games from Chess.com
  const loadGames = useCallback(
    async (newConfig: GameReviewConfig) => {
      console.log("loadGames called with config:", newConfig);
      setIsLoading(true);
      setError(null);
      setConfig(newConfig);

      try {
        console.log("Fetching games from Chess.com...");
        const fetchedGames = await fetchChessComGames(
          newConfig.username,
          newConfig.startDate,
          newConfig.endDate,
          newConfig.timeClasses.length > 0 ? newConfig.timeClasses : undefined
        );

        console.log("Fetched games (all colors):", fetchedGames.length);

        if (fetchedGames.length === 0) {
          setError("No games found in the selected date range.");
          setGames([]);
          setWhiteGameTree(createRootNode());
          setBlackGameTree(createRootNode());
          return;
        }

        // Store all games
        setGames(fetchedGames);

        // Split games by color
        const white = fetchedGames.filter(g => g.color === WHITE);
        const black = fetchedGames.filter(g => g.color === BLACK);

        console.log(`Split into ${white.length} White games and ${black.length} Black games`);

        // Build separate trees for each color
        const wTree = white.length > 0 ? buildGamePositionTree(white) : createRootNode();
        const bTree = black.length > 0 ? buildGamePositionTree(black) : createRootNode();
        
        setWhiteGameTree(wTree);
        setBlackGameTree(bTree);

        // Default to white if available, otherwise black
        setCurrentColor(white.length > 0 ? WHITE : BLACK);

        // Reset navigation state
        setCurrentFen(INITIAL_FEN);
        setSelectedDeviation(null);
        setWhiteComparisonResult(null);
        setBlackComparisonResult(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch games"
        );
        setGames([]);
        setWhiteGameTree(createRootNode());
        setBlackGameTree(createRootNode());
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Compare games to repertoire chapters - compares BOTH trees
  const doCompareToRepertoire = useCallback(
    (chapters: Chapter[]) => {
      if (chapters.length === 0 || games.length === 0) {
        setWhiteComparisonResult(null);
        setBlackComparisonResult(null);
        return;
      }

      const repertoireTrees: PositionTree[] = chapters.map(
        (ch) => ch.positionTree
      );

      // Compare white games
      if (whiteGames.length > 0) {
        const whiteResult = compareToRepertoireChapters(
          whiteGameTree,
          repertoireTrees,
          WHITE
        );
        setWhiteComparisonResult(whiteResult);
        setWhiteGameTree(whiteResult.markedTree);
      }

      // Compare black games
      if (blackGames.length > 0) {
        const blackResult = compareToRepertoireChapters(
          blackGameTree,
          repertoireTrees,
          BLACK
        );
        setBlackComparisonResult(blackResult);
        setBlackGameTree(blackResult.markedTree);
      }
    },
    [games, whiteGames, blackGames, whiteGameTree, blackGameTree]
  );

  // Navigate to a position by FEN
  const navigateToPosition = useCallback((fen: Fen) => {
    setCurrentFen(fen);
  }, []);

  // Navigate to a specific node
  const navigateToNode = useCallback((node: GamePositionNode) => {
    setCurrentFen(node.position.fen);
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setConfig(null);
    setGames([]);
    setWhiteGameTree(createRootNode());
    setBlackGameTree(createRootNode());
    setWhiteComparisonResult(null);
    setBlackComparisonResult(null);
    setCurrentFen(INITIAL_FEN);
    setSelectedDeviation(null);
    setError(null);
    setCurrentColor(WHITE);
  }, []);

  return {
    config,
    setConfig,
    isLoading,
    error,
    games,
    whiteGames,
    blackGames,
    whiteGameTree,
    blackGameTree,
    currentColor,
    setCurrentColor,
    gameTree,
    comparisonResult,
    currentNode,
    currentFen,
    selectedDeviation,
    setSelectedDeviation,
    loadGames,
    compareToRepertoire: doCompareToRepertoire,
    navigateToPosition,
    navigateToNode,
    reset,
  };
};

export default useGameReviewState;

