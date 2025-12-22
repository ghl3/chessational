"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
  invalidateComparisonCache: () => Promise<void>; // Call when repertoire changes
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

  // Loading states (granular)
  const [isLoading, setIsLoading] = useState(false); // Downloading from Chess.com
  const [isLoadingCache, setIsLoadingCache] = useState(true); // Checking/loading from cache
  const [isComparing, setIsComparing] = useState(false); // Comparing to repertoire
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
  
  // Track whether trees are ready (for cached loads, trees build async)
  const [treesReady, setTreesReady] = useState(false);

  // Navigation
  const [currentFen, setCurrentFen] = useState<Fen>(INITIAL_FEN);
  const [selectedDeviation, setSelectedDeviation] = useState<Deviation | null>(null);

  // Ref to prevent double-loading in React Strict Mode
  const cacheLoadedRef = useRef(false);

  // Load from cache on mount
  useEffect(() => {
    // Prevent double-loading in React Strict Mode
    if (cacheLoadedRef.current) {
      console.log("[Cache] Already loaded, skipping duplicate effect");
      return;
    }
    cacheLoadedRef.current = true;

    const loadFromCache = async () => {
      const startTime = performance.now();
      console.log("[Cache] Starting cache load...");
      
      try {
        // Check if we have a cached search config
        const cachedConfig = await db.gamesSearchConfig.get(1);
        
        if (!cachedConfig) {
          console.log(`[Cache] No cached config found. Total: ${(performance.now() - startTime).toFixed(1)}ms`);
          setIsLoadingCache(false);
          return;
        }

        // Load cached games
        const cachedGames = await db.chesscomGames.toArray();

        if (cachedGames.length === 0) {
          // Config exists but no games - clear stale data
          await db.gamesSearchConfig.delete(1);
          await db.cachedGameData.clear();
          console.log(`[Cache] No games in cache. Total: ${(performance.now() - startTime).toFixed(1)}ms`);
          setIsLoadingCache(false);
          return;
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
        
        setConfig(restoredConfig);
        setGames(cachedGames);

        if (cachedData) {
          // Trees and possibly comparison results are cached
          console.log(`[Cache] Found cached data! Loading instantly...`);
          setWhiteGameTree(cachedData.whiteTree);
          setBlackGameTree(cachedData.blackTree);
          const hasWhite = cachedData.whiteTree.children.length > 0 || cachedData.whiteTree.stats.gameCount > 0;
          setCurrentColor(hasWhite ? WHITE : BLACK);
          setTreesReady(true);
          
          // Also restore comparison results if available
          if (cachedData.whiteComparisonResult || cachedData.blackComparisonResult) {
            console.log(`[Cache] Restoring cached comparison results`);
            setWhiteComparisonResult(cachedData.whiteComparisonResult);
            setBlackComparisonResult(cachedData.blackComparisonResult);
          }
          
          console.log(`[Cache] Loaded from cache. Total: ${(performance.now() - startTime).toFixed(1)}ms`);
        } else {
          // Data not cached - need to build trees
          console.log(`[Cache] No cached data, building trees...`);
          const white = cachedGames.filter((g) => g.color === WHITE);
          const black = cachedGames.filter((g) => g.color === BLACK);

          const wTree = white.length > 0 ? buildGamePositionTree(white) : createRootNode();
          const bTree = black.length > 0 ? buildGamePositionTree(black) : createRootNode();

          setWhiteGameTree(wTree);
          setBlackGameTree(bTree);
          setCurrentColor(white.length > 0 ? WHITE : BLACK);
          setTreesReady(true);

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
        }

        setIsLoadingCache(false);
      } catch (err) {
        console.error("Failed to load from cache:", err);
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
      setTreesReady(false);
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
        setTreesReady(true);

        // Default to white if available, otherwise black
        setCurrentColor(white.length > 0 ? WHITE : BLACK);

        // Reset navigation state
        setCurrentFen(INITIAL_FEN);
        setSelectedDeviation(null);
        setWhiteComparisonResult(null);
        setBlackComparisonResult(null);

        // Save to IndexedDB cache
        try {
          // Clear previous cached data and save new ones
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

          // Save the search config
          const configToStore: GamesSearchConfig = {
            id: 1,
            username: newConfig.username,
            startDate: newConfig.startDate.getTime(),
            endDate: newConfig.endDate.getTime(),
            timeClasses: newConfig.timeClasses,
          };
          await db.gamesSearchConfig.put(configToStore);
          console.log("Games and trees cached to IndexedDB");
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
    async (chapters: Chapter[]) => {
      if (chapters.length === 0 || games.length === 0) {
        setWhiteComparisonResult(null);
        setBlackComparisonResult(null);
        return;
      }

      setIsComparing(true);
      const compareStart = performance.now();

      // Filter chapters by orientation - white repertoires for white games, black for black
      const whiteChapters = chapters.filter((ch) => ch.orientation === WHITE);
      const blackChapters = chapters.filter((ch) => ch.orientation === BLACK);

      let whiteResult: ComparisonResult | null = null;
      let blackResult: ComparisonResult | null = null;

      // Compare white games against white repertoires only
      if (whiteGames.length > 0 && whiteChapters.length > 0) {
        whiteResult = compareToChapters(
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
        blackResult = compareToChapters(
          blackGameTree,
          blackChapters,
          BLACK
        );
        setBlackComparisonResult(blackResult);
        setBlackGameTree(blackResult.markedTree);
      } else {
        setBlackComparisonResult(null);
      }

      console.log(`[Compare] Comparison took ${(performance.now() - compareStart).toFixed(1)}ms`);

      // Cache the comparison results
      try {
        const chapterNames = chapters.map(ch => ch.name).sort();
        const cachedData: CachedGameData = {
          id: 1,
          whiteComparisonResult: whiteResult,
          blackComparisonResult: blackResult,
          whiteTree: whiteResult?.markedTree || whiteGameTree,
          blackTree: blackResult?.markedTree || blackGameTree,
          comparedChapterNames: chapterNames,
        };
        await db.cachedGameData.put(cachedData);
        console.log(`[Cache] Saved comparison results to cache`);
      } catch (cacheErr) {
        console.error(`[Cache] Failed to save comparison results:`, cacheErr);
      } finally {
        setIsComparing(false);
      }
    },
    [games, whiteGames, blackGames, whiteGameTree, blackGameTree]
  );

  // Invalidate comparison cache (call when repertoire changes)
  const invalidateComparisonCache = useCallback(async () => {
    console.log(`[Cache] Invalidating comparison cache due to repertoire change`);
    setWhiteComparisonResult(null);
    setBlackComparisonResult(null);
    
    // Update the cached data to remove comparison results but keep trees
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
    setTreesReady(false);
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
      await db.cachedGameData.clear();
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
    isComparing,
    treesReady,
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
    invalidateComparisonCache,
  };
};

export default useGameReviewState;

