"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { useGameReviewState, GameReviewConfig, INITIAL_FEN } from "@/hooks/UseGameReviewState";
import { GamesConfig } from "@/components/GamesConfig";
import { MoveStatsTable } from "@/components/MoveStatsTable";
import { DeviationsList, GapsList } from "@/components/DeviationsList";
import { FlippablePanel, PanelView } from "@/components/FlippablePanel";
import { 
  GamePositionNode, 
  findPathToFen, 
  getMostCommonChild 
} from "@/chess/GamePositionTree";
import { normalizeFen } from "@/chess/Fen";
import { Deviation } from "@/utils/RepertoireComparer";
import { Color, WHITE, BLACK } from "chess.js";
import { Arrow } from "@/components/Chessboard";
import {
  generateSortedMoveArrows,
  generateDeviationArrows,
  generateUncoveredArrows,
  getDeviationsAtPosition,
} from "@/components/MoveArrows";

/**
 * Empty state shown when no games have been loaded
 */
const EmptyState: React.FC<{
  onConfigSubmit: (config: GameReviewConfig) => void;
  isLoading: boolean;
}> = ({ onConfigSubmit, isLoading }) => {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="bg-gray-800/50 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-white mb-4 text-center">
          Game Review
        </h2>
        <p className="text-gray-400 text-sm mb-6 text-center">
          Load your Chess.com games to analyze your opening repertoire and find
          where you or your opponents deviated.
        </p>
        <GamesConfig onSubmit={onConfigSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
};

/**
 * Loading indicator
 */
const LoadingState: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">{message || "Loading games from Chess.com..."}</p>
        <p className="text-gray-500 text-sm mt-1">This may take a moment</p>
      </div>
    </div>
  );
};

/**
 * Error state
 */
const ErrorState: React.FC<{ error: string; onRetry: () => void }> = ({
  error,
  onRetry,
}) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 max-w-md text-center">
        <div className="text-rose-400 text-4xl mb-3">⚠</div>
        <h3 className="text-rose-400 font-semibold mb-2">Error Loading Games</h3>
        <p className="text-gray-400 text-sm mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

/**
 * Header showing current configuration
 */
const GamesHeader: React.FC<{
  config: GameReviewConfig;
  whiteGameCount: number;
  blackGameCount: number;
  onReset: () => void;
  onCompare: () => void;
  hasRepertoire: boolean;
  isCompared: boolean;
}> = ({ config, whiteGameCount, blackGameCount, onReset, onCompare, hasRepertoire, isCompared }) => {
  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  const totalGames = whiteGameCount + blackGameCount;

  return (
    <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3">
      <div className="flex items-center gap-4">
        <div>
          <span className="text-gray-400 text-sm">Player:</span>{" "}
          <span className="text-white font-semibold">{config.username}</span>
        </div>
        <div className="text-gray-600">|</div>
        <div>
          <span className="text-gray-400 text-sm">Games:</span>{" "}
          <span className="text-white font-semibold">{totalGames}</span>
          <span className="text-gray-500 text-xs ml-1">
            ({whiteGameCount}W / {blackGameCount}B)
          </span>
        </div>
        <div className="text-gray-600">|</div>
        <div className="text-gray-400 text-sm">
          {formatDate(config.startDate)} - {formatDate(config.endDate)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {hasRepertoire && !isCompared && (
          <button
            onClick={onCompare}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition-colors"
          >
            Compare to Repertoire
          </button>
        )}
        <button
          onClick={onReset}
          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
        >
          New Search
        </button>
      </div>
    </div>
  );
};

/**
 * Color toggle for Moves tab
 */
const ColorToggle: React.FC<{
  currentColor: Color;
  onColorChange: (color: Color) => void;
  whiteCount: number;
  blackCount: number;
}> = ({ currentColor, onColorChange, whiteCount, blackCount }) => {
  return (
    <div className="flex gap-2 mb-3">
      <button
        onClick={() => onColorChange(WHITE)}
        disabled={whiteCount === 0}
        className={`
          flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm
          ${
            currentColor === WHITE
              ? "bg-white text-gray-900 font-semibold"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }
          ${whiteCount === 0 ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <span className="w-3 h-3 rounded-full bg-white border border-gray-400"></span>
        White ({whiteCount})
      </button>
      <button
        onClick={() => onColorChange(BLACK)}
        disabled={blackCount === 0}
        className={`
          flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm
          ${
            currentColor === BLACK
              ? "bg-gray-900 text-white font-semibold border border-gray-500"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }
          ${blackCount === 0 ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <span className="w-3 h-3 rounded-full bg-gray-900 border border-gray-500"></span>
        Black ({blackCount})
      </button>
    </div>
  );
};

/**
 * Main Games page component
 */
const GamesPage: React.FC = () => {
  const { chessboardState, studyData } = useAppContext();
  const gameReviewState = useGameReviewState();
  const [panelView, setPanelView] = useState<PanelView>("moves");
  
  // Track if auto-compare has been triggered to prevent re-running
  const hasAutoComparedRef = useRef(false);

  const {
    config,
    isLoading,
    isLoadingCache,
    isComparing,
    treesReady,
    error,
    games,
    whiteGames,
    blackGames,
    gameTree,
    comparisonResult,
    getNodeAtFen,
    currentColor,
    setCurrentColor,
    selectedDeviation,
    setSelectedDeviation,
    loadGames,
    compareToRepertoire,
    reset,
  } = gameReviewState;

  // Derive current position from chessboard (single source of truth)
  const currentFen = chessboardState.getCurrentFen() ?? INITIAL_FEN;
  
  // Derive current node from the game tree based on board position
  const currentNode = useMemo(() => {
    return getNodeAtFen(currentFen);
  }, [getNodeAtFen, currentFen]);

  // Sync board orientation with current color
  useEffect(() => {
    chessboardState.setOrientation(currentColor);
  }, [currentColor, chessboardState]);

  // Helper to load positions into the board for a given node
  // If extendPath is true, extends with main line continuation for forward navigation
  const navigateToNode = useCallback((node: GamePositionNode, extendPath: boolean = true) => {
    // Build path from root to this node
    const pathToPosition = findPathToFen(gameTree, node.position.fen);
    if (pathToPosition.length === 0) return;
    
    // Optionally extend path with main line continuation
    let positions = pathToPosition.map(n => n.position);
    let currentIndex = pathToPosition.length - 1;
    
    if (extendPath) {
      const extendedPath = [...pathToPosition];
      let lastNode = extendedPath[extendedPath.length - 1];
      while (lastNode && lastNode.children.length > 0) {
        const nextNode = getMostCommonChild(lastNode);
        if (!nextNode) break;
        extendedPath.push(nextNode);
        lastNode = nextNode;
      }
      positions = extendedPath.map(n => n.position);
    }
    
    chessboardState.clearAndSetPositions(positions, currentIndex);
  }, [gameTree, chessboardState]);

  // Navigate to a position by FEN (extends path for forward navigation)
  const navigateToPosition = useCallback((fen: string) => {
    const node = getNodeAtFen(fen);
    if (node) {
      navigateToNode(node, true);
    }
  }, [getNodeAtFen, navigateToNode]);
  
  // Navigate to a deviation (doesn't extend path - stops at deviation point)
  const navigateToDeviation = useCallback((fen: string) => {
    const node = getNodeAtFen(fen);
    if (node) {
      navigateToNode(node, false);
    }
  }, [getNodeAtFen, navigateToNode]);

  // Check if current position is at the selected deviation point
  const isAtDeviationPoint = useMemo(() => {
    if (!selectedDeviation || !currentFen) return false;
    return normalizeFen(currentFen) === normalizeFen(selectedDeviation.fen);
  }, [selectedDeviation, currentFen]);

  // Compute arrows based on current position and selection
  const arrows = useMemo((): Arrow[] => {
    // If we're at the deviation point, show deviation/gap arrows
    if (selectedDeviation && currentNode && comparisonResult && isAtDeviationPoint) {
      // Find ALL items at this position (of the same type)
      const itemsAtPosition = getDeviationsAtPosition(
        comparisonResult.deviations,
        selectedDeviation.fen
      ).filter((d) => d.deviatedBy === selectedDeviation.deviatedBy);
      
      // Get the last move that led to this position (for context)
      const lastMove = currentNode.position.lastMove;
      
      // Use different arrow generators for deviations vs uncovered lines
      return selectedDeviation.deviatedBy === "player"
        ? generateDeviationArrows(itemsAtPosition, lastMove)
        : generateUncoveredArrows(itemsAtPosition, lastMove);
    } 
    
    // If deviation is selected but we're NOT at the deviation point,
    // show only the last move arrow (helps track where we are)
    if (selectedDeviation && currentNode) {
      const lastMove = currentNode.position.lastMove;
      if (lastMove) {
        return [{
          from: lastMove.from,
          to: lastMove.to,
          color: "rgba(100, 100, 100, 0.5)", // Subtle gray for context
        }];
      }
      return [];
    }
    
    // Normal view: show frequency-based arrows for all moves
    if (currentNode && currentNode.children.length > 0) {
      return generateSortedMoveArrows(
        currentNode.children,
        currentNode.stats,
        comparisonResult !== null // Show repertoire colors if compared
      );
    }
    return [];
  }, [currentNode, comparisonResult, selectedDeviation, isAtDeviationPoint]);

  // Update arrows on the board
  useEffect(() => {
    chessboardState.setArrows(arrows);
  }, [arrows, chessboardState]);

  // Initialize board when game tree is ready
  const prevTreesReadyRef = useRef(false);
  useEffect(() => {
    // Only initialize when trees become ready (transition from false to true)
    if (treesReady && !prevTreesReadyRef.current && gameTree.children.length > 0) {
      navigateToPosition(INITIAL_FEN);
    }
    prevTreesReadyRef.current = treesReady;
  }, [treesReady, gameTree, navigateToPosition]);

  // Handle clicking a move in the stats table
  const handleMoveClick = useCallback(
    (node: GamePositionNode) => {
      // Clear selected deviation when navigating via move click
      setSelectedDeviation(null);
      navigateToNode(node);
    },
    [navigateToNode, setSelectedDeviation]
  );

  // Handle clicking a deviation
  const handleDeviationClick = useCallback(
    (deviation: Deviation) => {
      setSelectedDeviation(deviation);
      // Switch to the correct color's game tree if needed
      if (deviation.playerColor !== currentColor) {
        setCurrentColor(deviation.playerColor);
      }
      // Navigate to the deviation position (don't extend path - stops at deviation)
      navigateToDeviation(deviation.fen);
    },
    [navigateToDeviation, setSelectedDeviation, currentColor, setCurrentColor]
  );

  // Handle compare button click - use ALL chapters from ALL studies
  const handleCompare = useCallback(() => {
    if (studyData.allChapters && studyData.allChapters.length > 0) {
      compareToRepertoire(studyData.allChapters);
    }
  }, [compareToRepertoire, studyData.allChapters]);

  // Handle retry after error
  const handleRetry = useCallback(() => {
    reset();
  }, [reset]);

  // Auto-compare when games are loaded and repertoire is available
  // Using a ref to track if we've already auto-compared prevents the need for eslint-disable
  const shouldAutoCompare =
    games.length > 0 &&
    treesReady &&
    studyData.allChapters &&
    studyData.allChapters.length > 0 &&
    comparisonResult === null &&
    !isLoading &&
    !isLoadingCache &&
    !hasAutoComparedRef.current;

  useEffect(() => {
    if (shouldAutoCompare && studyData.allChapters) {
      console.log("Auto-comparing to repertoire...");
      hasAutoComparedRef.current = true;
      compareToRepertoire(studyData.allChapters);
    }
  }, [shouldAutoCompare, compareToRepertoire, studyData.allChapters]);

  // Reset auto-compare flag when games are reset
  useEffect(() => {
    if (games.length === 0) {
      hasAutoComparedRef.current = false;
    }
  }, [games.length]);

  // Memoized values
  const hasRepertoire = useMemo(
    () => studyData.allChapters && studyData.allChapters.length > 0,
    [studyData.allChapters]
  );

  // Separate player deviations from opponent uncovered lines
  const playerDeviations = useMemo(
    () => comparisonResult?.deviations.filter((d) => d.deviatedBy === "player") ?? [],
    [comparisonResult]
  );
  
  const uncoveredLines = useMemo(
    () => comparisonResult?.deviations.filter((d) => d.deviatedBy === "opponent") ?? [],
    [comparisonResult]
  );

  const deviationsCount = playerDeviations.length;
  const uncoveredCount = uncoveredLines.length;

  // Handle color change
  const handleColorChange = useCallback((color: Color) => {
    setCurrentColor(color);
    // Reset to starting position when switching colors
    navigateToPosition(INITIAL_FEN);
  }, [setCurrentColor, navigateToPosition]);

  // Render based on state
  if (isLoadingCache) {
    return <LoadingState message="Loading cached games..." />;
  }

  if (isLoading) {
    return <LoadingState message="Downloading games from Chess.com..." />;
  }

  if (isComparing) {
    return <LoadingState message="Comparing games to repertoire..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  if (!config || games.length === 0) {
    return <EmptyState onConfigSubmit={loadGames} isLoading={isLoading} />;
  }

  // Main view with data
  return (
    <FlippablePanel
      initialView={panelView}
      onViewChange={setPanelView}
      deviationsCount={deviationsCount}
      gapsCount={uncoveredCount}
      header={
        <GamesHeader
          config={config}
          whiteGameCount={whiteGames.length}
          blackGameCount={blackGames.length}
          onReset={reset}
          onCompare={handleCompare}
          hasRepertoire={hasRepertoire ?? false}
          isCompared={comparisonResult !== null}
        />
      }
      movesContent={
            <div className="flex flex-col h-full">
              <ColorToggle
                currentColor={currentColor}
                onColorChange={handleColorChange}
                whiteCount={whiteGames.length}
                blackCount={blackGames.length}
              />
              {currentNode ? (
                <MoveStatsTable
                  nodes={currentNode.children}
                  parentStats={currentNode.stats}
                  onMoveClick={handleMoveClick}
                  selectedMove={selectedDeviation?.playedMove.san}
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No position selected
                </div>
              )}
            </div>
          }
          deviationsContent={
            comparisonResult ? (
              <DeviationsList
                deviations={comparisonResult.deviations}
                onDeviationClick={handleDeviationClick}
                selectedDeviation={selectedDeviation}
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="mb-2">No comparison data</p>
                {hasRepertoire ? (
                  <p className="text-sm">
                    Click &quot;Compare to Repertoire&quot; to see deviations
                  </p>
                ) : (
                  <p className="text-sm">
                    Add a study first to compare against your repertoire
                  </p>
                )}
              </div>
            )
          }
          gapsContent={
            comparisonResult ? (
              <GapsList
                deviations={comparisonResult.deviations}
                onDeviationClick={handleDeviationClick}
                selectedDeviation={selectedDeviation}
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="mb-2">No comparison data</p>
                {hasRepertoire ? (
                  <p className="text-sm">
                    Click &quot;Compare to Repertoire&quot; to see gaps
                  </p>
                ) : (
                  <p className="text-sm">
                    Add a study first to compare against your repertoire
                  </p>
                )}
              </div>
            )
          }
        />
  );
};

export default GamesPage;
