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
import { Color, WHITE } from "chess.js";
import { Chapter } from "@/chess/Chapter";

export interface GameReviewConfig {
  username: string;
  startDate: Date;
  endDate: Date;
  timeClasses: string[];
  playerColor: Color;
}

export interface GameReviewState {
  // Configuration
  config: GameReviewConfig | null;
  setConfig: (config: GameReviewConfig) => void;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Data
  games: ChessComGame[];
  gameTree: GamePositionTree;
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

const DEFAULT_START_DATE = (): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() - 3); // Last 3 months
  return date;
};

const INITIAL_FEN: Fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const useGameReviewState = (): GameReviewState => {
  // Configuration
  const [config, setConfig] = useState<GameReviewConfig | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [games, setGames] = useState<ChessComGame[]>([]);
  const [gameTree, setGameTree] = useState<GamePositionTree>(createRootNode());
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);

  // Navigation
  const [currentFen, setCurrentFen] = useState<Fen>(INITIAL_FEN);
  const [selectedDeviation, setSelectedDeviation] = useState<Deviation | null>(
    null
  );

  // Computed current node
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

        // Filter games to only include those where user played the selected color
        // This is critical for correct deviation detection!
        const filteredGames = fetchedGames.filter(
          (game) => game.color === newConfig.playerColor
        );

        console.log(
          `Filtered to ${filteredGames.length} games where user played as ${newConfig.playerColor === "w" ? "White" : "Black"}`
        );

        if (filteredGames.length === 0) {
          setError(
            `No games found where you played as ${newConfig.playerColor === "w" ? "White" : "Black"} in the selected date range.`
          );
          setGames([]);
          setGameTree(createRootNode());
          return;
        }

        setGames(filteredGames);

        // Build the game tree from filtered games only
        const tree = buildGamePositionTree(filteredGames);
        setGameTree(tree);

        // Reset to starting position
        setCurrentFen(INITIAL_FEN);
        setSelectedDeviation(null);
        setComparisonResult(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch games"
        );
        setGames([]);
        setGameTree(createRootNode());
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Compare games to repertoire chapters
  const doCompareToRepertoire = useCallback(
    (chapters: Chapter[]) => {
      if (chapters.length === 0 || games.length === 0) {
        setComparisonResult(null);
        return;
      }

      const repertoireTrees: PositionTree[] = chapters.map(
        (ch) => ch.positionTree
      );

      const playerColor = config?.playerColor ?? WHITE;
      const result = compareToRepertoireChapters(
        gameTree,
        repertoireTrees,
        playerColor
      );

      setComparisonResult(result);
      // Update the tree with marked nodes
      setGameTree(result.markedTree);
    },
    [games, gameTree, config]
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
    setGameTree(createRootNode());
    setComparisonResult(null);
    setCurrentFen(INITIAL_FEN);
    setSelectedDeviation(null);
    setError(null);
  }, []);

  return {
    config,
    setConfig,
    isLoading,
    error,
    games,
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

