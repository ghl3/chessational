"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { db, GamesSearchConfig, CachedGameData } from "@/app/db";

export const INITIAL_FEN: Fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

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

  // Loading states (granular for better UX)
  isLoading: boolean; // True while downloading games from Chess.com
  isLoadingCache: boolean; // True while checking/loading from cache
  isComparing: boolean; // True while comparing games to repertoire
  treesReady: boolean; // True when game trees have been built
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

  // Get node at a given FEN (derived from chessboard state)
  getNodeAtFen: (fen: Fen) => GamePositionNode | null;

  // Selected deviation
  selectedDeviation: Deviation | null;
  setSelectedDeviation: (deviation: Deviation | null) => void;

  // Actions
  loadGames: (config: GameReviewConfig) => Promise<void>;
  compareToRepertoire: (chapters: Chapter[]) => void;
  reset: () => void;
  invalidateComparisonCache: () => Promise<void>; // Call when repertoire changes
}

interface CachedState {
  config: GameReviewConfig | null;
  games: ChessComGame[];
  whiteGameTree: GamePositionTree;
  blackGameTree: GamePositionTree;
  whiteComparisonResult: ComparisonResult | null;
  blackComparisonResult: ComparisonResult | null;
  currentColor: Color;
  treesReady: boolean;
}

/**
 * Load games and trees from IndexedDB cache
 */
const loadFromCache = async (): Promise<CachedState | null> => {
  const startTime = performance.now();
  console.log("[Cache] Starting cache load...");
  
  // Check if we have a cached search config
  const cachedConfig = await db.gamesSearchConfig.get(1);
  
  if (!cachedConfig) {
    console.log(`[Cache] No cached config found. Total: ${(performance.now() - startTime).toFixed(1)}ms`);
    return null;
  }

  // Load cached games
  const cachedGames = await db.chesscomGames.toArray();

  if (cachedGames.length === 0) {
    // Config exists but no games - clear stale data
    await db.gamesSearchConfig.delete(1);
    await db.cachedGameData.clear();
    console.log(`[Cache] No games in cache. Total: ${(performance.now() - startTime).toFixed(1)}ms`);
    return null;
  }

  // Try to load cached game data (trees + comparison results)
  let cachedData: CachedGameData | undefined;
  try {
    cachedData = await db.cachedGameData.get(1);
    console.log(`[Cache] cachedGameData.get(1) returned:`, cachedData ? 'found' : 'not found');
  } catch (dataErr) {
    console.error(`[Cache] Error loading cached data:`, dataErr);
    cachedData = undefined;
  }
  
  // Restore config
  const restoredConfig: GameReviewConfig = {
    username: cachedConfig.username,
    startDate: new Date(cachedConfig.startDate),
    endDate: new Date(cachedConfig.endDate),
    timeClasses: cachedConfig.timeClasses,
  };

  if (cachedData) {
    // Trees and possibly comparison results are cached
    console.log(`[Cache] Found cached data! Loading instantly...`);
    const hasWhite = cachedData.whiteTree.children.length > 0 || cachedData.whiteTree.stats.gameCount > 0;
    
    console.log(`[Cache] Loaded from cache. Total: ${(performance.now() - startTime).toFixed(1)}ms`);
    
    return {
      config: restoredConfig,
      games: cachedGames,
      whiteGameTree: cachedData.whiteTree,
      blackGameTree: cachedData.blackTree,
      whiteComparisonResult: cachedData.whiteComparisonResult,
      blackComparisonResult: cachedData.blackComparisonResult,
      currentColor: hasWhite ? WHITE : BLACK,
      treesReady: true,
    };
  } else {
    // Data not cached - need to build trees
    console.log(`[Cache] No cached data, building trees...`);
    const white = cachedGames.filter((g) => g.color === WHITE);
    const black = cachedGames.filter((g) => g.color === BLACK);

    const wTree = white.length > 0 ? buildGamePositionTree(white) : createRootNode();
    const bTree = black.length > 0 ? buildGamePositionTree(black) : createRootNode();

    // Cache the trees for next time (comparison results will be added later)
    try {
      await db.cachedGameData.put({ 
        id: 1, 
        whiteTree: wTree, 
        blackTree: bTree,
        whiteComparisonResult: null,
        blackComparisonResult: null,
        comparedChapterNames: [],
      });
      console.log(`[Cache] Successfully saved trees to cache`);
    } catch (saveErr) {
      console.error(`[Cache] Failed to save trees:`, saveErr);
    }
    console.log(`[Cache] Built and cached trees. Total: ${(performance.now() - startTime).toFixed(1)}ms`);

    return {
      config: restoredConfig,
      games: cachedGames,
      whiteGameTree: wTree,
      blackGameTree: bTree,
      whiteComparisonResult: null,
      blackComparisonResult: null,
      currentColor: white.length > 0 ? WHITE : BLACK,
      treesReady: true,
    };
  }
};

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
  const queryClient = useQueryClient();

  // Use TanStack Query for cache loading
  const {
    data: cachedState,
    isLoading: isLoadingCache,
  } = useQuery({
    queryKey: ["games-cache"],
    queryFn: loadFromCache,
    staleTime: Infinity, // Cache doesn't go stale automatically
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Local state that can be updated by mutations
  const [localState, setLocalState] = useState<{
    config: GameReviewConfig | null;
    games: ChessComGame[];
    whiteGameTree: GamePositionTree;
    blackGameTree: GamePositionTree;
    whiteComparisonResult: ComparisonResult | null;
    blackComparisonResult: ComparisonResult | null;
    currentColor: Color;
    treesReady: boolean;
    error: string | null;
  }>({
    config: null,
    games: [],
    whiteGameTree: createRootNode(),
    blackGameTree: createRootNode(),
    whiteComparisonResult: null,
    blackComparisonResult: null,
    currentColor: WHITE,
    treesReady: false,
    error: null,
  });

  // Track if we've initialized color from cache
  const hasInitializedColorRef = useRef(false);

  // Initialize currentColor from cache when it first loads
  useEffect(() => {
    if (cachedState && !hasInitializedColorRef.current) {
      hasInitializedColorRef.current = true;
      setLocalState((prev) => ({ ...prev, currentColor: cachedState.currentColor }));
    }
  }, [cachedState]);

  // Merge cached state with local state (local state takes precedence if set)
  const effectiveState = useMemo(() => {
    // If we have local games loaded, use local state
    if (localState.games.length > 0) {
      return localState;
    }
    // Otherwise use cached state if available
    if (cachedState) {
      return {
        ...localState,
        config: cachedState.config,
        games: cachedState.games,
        whiteGameTree: cachedState.whiteGameTree,
        blackGameTree: cachedState.blackGameTree,
        whiteComparisonResult: cachedState.whiteComparisonResult,
        blackComparisonResult: cachedState.blackComparisonResult,
        // Keep localState.currentColor - user interactions should override cache
        currentColor: localState.currentColor,
        treesReady: cachedState.treesReady,
      };
    }
    return localState;
  }, [cachedState, localState]);

  // Separate comparison results state (can be updated independently)
  const [comparisonState, setComparisonState] = useState<{
    whiteResult: ComparisonResult | null;
    blackResult: ComparisonResult | null;
    isComparing: boolean;
  }>({
    whiteResult: null,
    blackResult: null,
    isComparing: false,
  });

  // Selected deviation state
  const [selectedDeviation, setSelectedDeviation] = useState<Deviation | null>(null);

  // Load games mutation
  const loadGamesMutation = useMutation({
    mutationFn: async (newConfig: GameReviewConfig) => {
      console.log("loadGames called with config:", newConfig);
      console.log("Fetching games from Chess.com...");
      const fetchedGames = await fetchChessComGames(
        newConfig.username,
        newConfig.startDate,
        newConfig.endDate,
        newConfig.timeClasses.length > 0 ? newConfig.timeClasses : undefined
      );
      console.log("Fetched games (all colors):", fetchedGames.length);
      return { config: newConfig, games: fetchedGames };
    },
    onMutate: (newConfig) => {
      setLocalState((prev) => ({
        ...prev,
        config: newConfig,
        treesReady: false,
        error: null,
      }));
    },
    onSuccess: async ({ config: newConfig, games: fetchedGames }) => {
      if (fetchedGames.length === 0) {
        setLocalState((prev) => ({
          ...prev,
          error: "No games found in the selected date range.",
          games: [],
          whiteGameTree: createRootNode(),
          blackGameTree: createRootNode(),
          treesReady: false,
        }));
        return;
      }

      // Split games by color
      const white = fetchedGames.filter(g => g.color === WHITE);
      const black = fetchedGames.filter(g => g.color === BLACK);
      console.log(`Split into ${white.length} White games and ${black.length} Black games`);

      // Build separate trees for each color
      const wTree = white.length > 0 ? buildGamePositionTree(white) : createRootNode();
      const bTree = black.length > 0 ? buildGamePositionTree(black) : createRootNode();

      // Update local state
      setLocalState({
        config: newConfig,
        games: fetchedGames,
        whiteGameTree: wTree,
        blackGameTree: bTree,
        whiteComparisonResult: null,
        blackComparisonResult: null,
        currentColor: white.length > 0 ? WHITE : BLACK,
        treesReady: true,
        error: null,
      });

      // Reset comparison state
      setComparisonState({
        whiteResult: null,
        blackResult: null,
        isComparing: false,
      });
      setSelectedDeviation(null);

      // Save to IndexedDB cache
      try {
        await db.chesscomGames.clear();
        await db.chesscomGames.bulkPut(fetchedGames);
        await db.cachedGameData.clear();
        await db.cachedGameData.put({ 
          id: 1, 
          whiteTree: wTree, 
          blackTree: bTree,
          whiteComparisonResult: null,
          blackComparisonResult: null,
          comparedChapterNames: [],
        });
        console.log(`[Cache] Saved ${fetchedGames.length} games and trees to cache`);

        const configToStore: GamesSearchConfig = {
          id: 1,
          username: newConfig.username,
          startDate: newConfig.startDate.getTime(),
          endDate: newConfig.endDate.getTime(),
          timeClasses: newConfig.timeClasses,
        };
        await db.gamesSearchConfig.put(configToStore);
        console.log("Games and trees cached to IndexedDB");

        // Invalidate query cache so next mount loads fresh data
        queryClient.invalidateQueries({ queryKey: ["games-cache"] });
      } catch (cacheErr) {
        console.error("Failed to cache games:", cacheErr);
      }
    },
    onError: (err) => {
      setLocalState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to fetch games",
        games: [],
        whiteGameTree: createRootNode(),
        blackGameTree: createRootNode(),
        treesReady: false,
      }));
    },
  });

  // Derived state: games filtered by color
  const whiteGames = useMemo(() => effectiveState.games.filter(g => g.color === WHITE), [effectiveState.games]);
  const blackGames = useMemo(() => effectiveState.games.filter(g => g.color === BLACK), [effectiveState.games]);

  // Current game tree based on selected color
  const gameTree = useMemo(() => {
    return effectiveState.currentColor === WHITE ? effectiveState.whiteGameTree : effectiveState.blackGameTree;
  }, [effectiveState.currentColor, effectiveState.whiteGameTree, effectiveState.blackGameTree]);

  // Get effective comparison results (from comparison state or cached)
  const effectiveWhiteComparison = comparisonState.whiteResult ?? effectiveState.whiteComparisonResult;
  const effectiveBlackComparison = comparisonState.blackResult ?? effectiveState.blackComparisonResult;

  // Combined comparison result for Deviations/Gaps tabs
  const comparisonResult = useMemo(() => {
    return combineComparisonResults(effectiveWhiteComparison, effectiveBlackComparison);
  }, [effectiveWhiteComparison, effectiveBlackComparison]);

  // Get node at a given FEN - derived from chessboard state by caller
  const getNodeAtFen = useCallback((fen: Fen): GamePositionNode | null => {
    return findNodeByFen(gameTree, fen);
  }, [gameTree]);

  // Load games wrapper
  const loadGames = useCallback(
    async (newConfig: GameReviewConfig) => {
      await loadGamesMutation.mutateAsync(newConfig);
    },
    [loadGamesMutation]
  );

  // Compare games to repertoire chapters - compares BOTH trees
  const doCompareToRepertoire = useCallback(
    async (chapters: Chapter[]) => {
      if (chapters.length === 0 || effectiveState.games.length === 0) {
        setComparisonState({
          whiteResult: null,
          blackResult: null,
          isComparing: false,
        });
        return;
      }

      setComparisonState((prev) => ({ ...prev, isComparing: true }));
      const compareStart = performance.now();

      // Filter chapters by orientation
      const whiteChapters = chapters.filter((ch) => ch.orientation === WHITE);
      const blackChapters = chapters.filter((ch) => ch.orientation === BLACK);

      let whiteResult: ComparisonResult | null = null;
      let blackResult: ComparisonResult | null = null;

      // Compare white games against white repertoires only
      if (whiteGames.length > 0 && whiteChapters.length > 0) {
        whiteResult = compareToChapters(
          effectiveState.whiteGameTree,
          whiteChapters,
          WHITE
        );
        // Update tree with marked nodes
        setLocalState((prev) => ({
          ...prev,
          whiteGameTree: whiteResult!.markedTree,
        }));
      }

      // Compare black games against black repertoires only
      if (blackGames.length > 0 && blackChapters.length > 0) {
        blackResult = compareToChapters(
          effectiveState.blackGameTree,
          blackChapters,
          BLACK
        );
        // Update tree with marked nodes
        setLocalState((prev) => ({
          ...prev,
          blackGameTree: blackResult!.markedTree,
        }));
      }

      console.log(`[Compare] Comparison took ${(performance.now() - compareStart).toFixed(1)}ms`);

      setComparisonState({
        whiteResult,
        blackResult,
        isComparing: false,
      });

      // Cache the comparison results
      try {
        const chapterNames = chapters.map(ch => ch.name).sort();
        const cachedData: CachedGameData = {
          id: 1,
          whiteComparisonResult: whiteResult,
          blackComparisonResult: blackResult,
          whiteTree: whiteResult?.markedTree || effectiveState.whiteGameTree,
          blackTree: blackResult?.markedTree || effectiveState.blackGameTree,
          comparedChapterNames: chapterNames,
        };
        await db.cachedGameData.put(cachedData);
        console.log(`[Cache] Saved comparison results to cache`);
      } catch (cacheErr) {
        console.error(`[Cache] Failed to save comparison results:`, cacheErr);
      }
    },
    [effectiveState.games.length, effectiveState.whiteGameTree, effectiveState.blackGameTree, whiteGames.length, blackGames.length]
  );

  // Invalidate comparison cache
  const invalidateComparisonCache = useCallback(async () => {
    console.log(`[Cache] Invalidating comparison cache due to repertoire change`);
    setComparisonState({
      whiteResult: null,
      blackResult: null,
      isComparing: false,
    });
    
    try {
      const cachedData = await db.cachedGameData.get(1);
      if (cachedData) {
        await db.cachedGameData.put({
          ...cachedData,
          whiteComparisonResult: null,
          blackComparisonResult: null,
          comparedChapterNames: [],
        });
        console.log(`[Cache] Comparison cache invalidated`);
      }
    } catch (err) {
      console.error(`[Cache] Failed to invalidate comparison cache:`, err);
    }
  }, []);

  // Set current color
  const setCurrentColor = useCallback((color: Color) => {
    setLocalState((prev) => ({ ...prev, currentColor: color }));
  }, []);

  // Set config
  const setConfig = useCallback((config: GameReviewConfig) => {
    setLocalState((prev) => ({ ...prev, config }));
  }, []);

  // Reset all state and clear cache
  const reset = useCallback(async () => {
    setLocalState({
      config: null,
      games: [],
      whiteGameTree: createRootNode(),
      blackGameTree: createRootNode(),
      whiteComparisonResult: null,
      blackComparisonResult: null,
      currentColor: WHITE,
      treesReady: false,
      error: null,
    });
    setComparisonState({
      whiteResult: null,
      blackResult: null,
      isComparing: false,
    });
    setSelectedDeviation(null);

    // Clear IndexedDB cache
    try {
      await db.gamesSearchConfig.clear();
      await db.chesscomGames.clear();
      await db.cachedGameData.clear();
      console.log("Games cache cleared");
      
      // Invalidate query cache
      queryClient.invalidateQueries({ queryKey: ["games-cache"] });
    } catch (err) {
      console.error("Failed to clear cache:", err);
    }
  }, [queryClient]);

  return {
    config: effectiveState.config,
    setConfig,
    isLoading: loadGamesMutation.isPending,
    isLoadingCache,
    isComparing: comparisonState.isComparing,
    treesReady: effectiveState.treesReady,
    error: effectiveState.error,
    games: effectiveState.games,
    whiteGames,
    blackGames,
    whiteGameTree: effectiveState.whiteGameTree,
    blackGameTree: effectiveState.blackGameTree,
    currentColor: effectiveState.currentColor,
    setCurrentColor,
    gameTree,
    comparisonResult,
    getNodeAtFen,
    selectedDeviation,
    setSelectedDeviation,
    loadGames,
    compareToRepertoire: doCompareToRepertoire,
    reset,
    invalidateComparisonCache,
  };
};

export default useGameReviewState;
