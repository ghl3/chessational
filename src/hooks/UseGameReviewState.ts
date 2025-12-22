"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
  compareToChapters,
  ComparisonResult,
  Deviation,
} from "@/utils/RepertoireComparer";
import { Fen } from "@/chess/Fen";
import { Color, WHITE, BLACK } from "chess.js";
import { Chapter } from "@/chess/Chapter";
import { db, GamesSearchConfig } from "@/app/db";

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
  isLoadingCache: boolean; // True while checking/loading from cache
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
  const [isLoadingCache, setIsLoadingCache] = useState(true); // Start true - checking cache on mount
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

  // Load from cache on mount
  useEffect(() => {
    const loadFromCache = async () => {
      try {
        // Check if we have a cached search config
        const cachedConfig = await db.gamesSearchConfig.get(1);
        if (!cachedConfig) {
          setIsLoadingCache(false);
          return;
        }

        // Load cached games
        const cachedGames = await db.chesscomGames
          .where("username")
          .equalsIgnoreCase(cachedConfig.username)
          .toArray();

        if (cachedGames.length === 0) {
          // Config exists but no games - clear the stale config
          await db.gamesSearchConfig.delete(1);
          setIsLoadingCache(false);
          return;
        }

        console.log(`Loaded ${cachedGames.length} games from cache`);

        // Restore config
        const restoredConfig: GameReviewConfig = {
          username: cachedConfig.username,
          startDate: new Date(cachedConfig.startDate),
          endDate: new Date(cachedConfig.endDate),
          timeClasses: cachedConfig.timeClasses,
        };
        setConfig(restoredConfig);

        // Set games and build trees
        setGames(cachedGames);

        const white = cachedGames.filter((g) => g.color === WHITE);
        const black = cachedGames.filter((g) => g.color === BLACK);

        const wTree = white.length > 0 ? buildGamePositionTree(white) : createRootNode();
        const bTree = black.length > 0 ? buildGamePositionTree(black) : createRootNode();

        setWhiteGameTree(wTree);
        setBlackGameTree(bTree);
        setCurrentColor(white.length > 0 ? WHITE : BLACK);
      } catch (err) {
        console.error("Failed to load from cache:", err);
      } finally {
        setIsLoadingCache(false);
      }
    };

    loadFromCache();
  }, []);

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

        // Save to IndexedDB cache
        try {
          // Clear previous cached games and save new ones
          await db.chesscomGames.clear();
          await db.chesscomGames.bulkPut(fetchedGames);

          // Save the search config
          const configToStore: GamesSearchConfig = {
            id: 1,
            username: newConfig.username,
            startDate: newConfig.startDate.getTime(),
            endDate: newConfig.endDate.getTime(),
            timeClasses: newConfig.timeClasses,
          };
          await db.gamesSearchConfig.put(configToStore);
          console.log("Games cached to IndexedDB");
        } catch (cacheErr) {
          console.error("Failed to cache games:", cacheErr);
          // Don't fail the load if caching fails
        }
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
  // Filter chapters by orientation to match the player color
  const doCompareToRepertoire = useCallback(
    (chapters: Chapter[]) => {
      if (chapters.length === 0 || games.length === 0) {
        setWhiteComparisonResult(null);
        setBlackComparisonResult(null);
        return;
      }

      // Filter chapters by orientation - white repertoires for white games, black for black
      const whiteChapters = chapters.filter((ch) => ch.orientation === WHITE);
      const blackChapters = chapters.filter((ch) => ch.orientation === BLACK);

      // Compare white games against white repertoires only
      if (whiteGames.length > 0 && whiteChapters.length > 0) {
        const whiteResult = compareToChapters(
          whiteGameTree,
          whiteChapters,
          WHITE
        );
        setWhiteComparisonResult(whiteResult);
        setWhiteGameTree(whiteResult.markedTree);
      } else {
        setWhiteComparisonResult(null);
      }

      // Compare black games against black repertoires only
      if (blackGames.length > 0 && blackChapters.length > 0) {
        const blackResult = compareToChapters(
          blackGameTree,
          blackChapters,
          BLACK
        );
        setBlackComparisonResult(blackResult);
        setBlackGameTree(blackResult.markedTree);
      } else {
        setBlackComparisonResult(null);
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

  // Reset all state and clear cache
  const reset = useCallback(async () => {
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

    // Clear IndexedDB cache
    try {
      await db.gamesSearchConfig.clear();
      await db.chesscomGames.clear();
      console.log("Games cache cleared");
    } catch (err) {
      console.error("Failed to clear cache:", err);
    }
  }, []);

  return {
    config,
    setConfig,
    isLoading,
    isLoadingCache,
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

