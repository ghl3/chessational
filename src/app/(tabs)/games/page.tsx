"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { useGameReviewState, GameReviewConfig } from "@/hooks/UseGameReviewState";
import { GamesConfig } from "@/components/GamesConfig";
import { MoveStatsTable } from "@/components/MoveStatsTable";
import { DeviationsList, GapsList } from "@/components/DeviationsList";
import { FlippablePanel, PanelView } from "@/components/FlippablePanel";
import { generateSortedMoveArrows, generateDeviationArrows, generateUncoveredArrows, getDeviationsAtPosition } from "@/components/MoveArrows";
import { GamePositionNode, findPathToFen, getMostCommonChild } from "@/chess/GamePositionTree";
import { Deviation } from "@/utils/RepertoireComparer";
import { Color, WHITE, BLACK } from "chess.js";

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
const LoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading games from Chess.com...</p>
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
  
  // Track the current path through the game tree for chessboard sync
  const [currentPath, setCurrentPath] = useState<GamePositionNode[]>([]);
  
  // Ref to prevent sync loops between game review state and chessboard
  const isSyncingFromGameState = useRef(false);
  const lastSyncedFen = useRef<string | null>(null);
  const lastSyncedTreeSize = useRef<number>(0);

  const {
    config,
    isLoading,
    error,
    games,
    whiteGames,
    blackGames,
    gameTree,
    comparisonResult,
    currentNode,
    currentFen,
    currentColor,
    setCurrentColor,
    selectedDeviation,
    setSelectedDeviation,
    loadGames,
    compareToRepertoire,
    navigateToNode,
    navigateToPosition,
    reset,
  } = gameReviewState;

  // Build path and sync chessboard when current position changes (from game review state)
  useEffect(() => {
    if (!gameTree || !currentFen) return;
    
    // Count tree size to detect when tree changes (e.g., when games are loaded)
    const treeSize = gameTree.children.length;
    
    // Skip if FEN hasn't changed AND tree hasn't changed
    if (lastSyncedFen.current === currentFen && lastSyncedTreeSize.current === treeSize) return;
    
    // Build path from root to current position
    const pathToPosition = findPathToFen(gameTree, currentFen);
    if (pathToPosition.length === 0) return;
    
    // Extend path with main line continuation (most common moves) for forward navigation
    const extendedPath = [...pathToPosition];
    let lastNode = extendedPath[extendedPath.length - 1];
    while (lastNode && lastNode.children.length > 0) {
      const nextNode = getMostCommonChild(lastNode);
      if (!nextNode) break;
      extendedPath.push(nextNode);
      lastNode = nextNode;
    }
    
    setCurrentPath(extendedPath);
    lastSyncedFen.current = currentFen;
    lastSyncedTreeSize.current = treeSize;
    
    // Mark that we're syncing from game state to prevent loop
    isSyncingFromGameState.current = true;
    
    // Load all positions into chessboard, index at current position (not end)
    const positions = extendedPath.map(node => node.position);
    const currentIndex = pathToPosition.length - 1; // Index of current position in extended path
    chessboardState.clearAndSetPositions(positions, currentIndex);
    
    // Reset flag after a short delay to allow chessboard to update
    setTimeout(() => {
      isSyncingFromGameState.current = false;
    }, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFen, gameTree]);
  
  // Sync game review state when chessboard navigates via arrows
  useEffect(() => {
    // Skip if we're currently syncing from game state
    if (isSyncingFromGameState.current) return;
    
    // Only handle if we have a path and the chessboard has positions
    if (currentPath.length === 0 || chessboardState.positions.length === 0) return;
    
    const chessboardIndex = chessboardState.currentPositionIndex;
    
    // If the chessboard index corresponds to a different node in our path, sync it
    if (chessboardIndex >= 0 && chessboardIndex < currentPath.length) {
      const nodeAtIndex = currentPath[chessboardIndex];
      if (nodeAtIndex && nodeAtIndex.position.fen !== currentFen) {
        // Clear selected deviation when navigating
        setSelectedDeviation(null);
        // Update the lastSyncedFen before navigating to prevent double-sync
        lastSyncedFen.current = nodeAtIndex.position.fen;
        navigateToPosition(nodeAtIndex.position.fen);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chessboardState.currentPositionIndex, currentPath]);

  // Update arrows when current node or selected deviation changes
  useEffect(() => {
    // If a deviation/uncovered item is selected, show appropriate arrows
    if (selectedDeviation && currentNode && comparisonResult) {
      // Find ALL items at this position (of the same type)
      const itemsAtPosition = getDeviationsAtPosition(
        comparisonResult.deviations,
        selectedDeviation.fen
      ).filter((d) => d.deviatedBy === selectedDeviation.deviatedBy);
      
      // Get the last move that led to this position (for context)
      const lastMove = currentNode.position.lastMove;
      
      // Use different arrow generators for deviations vs uncovered lines
      const arrows = selectedDeviation.deviatedBy === "player"
        ? generateDeviationArrows(itemsAtPosition, lastMove)
        : generateUncoveredArrows(itemsAtPosition, lastMove);
      
      chessboardState.setArrows(arrows);
    } else if (currentNode && currentNode.children.length > 0) {
      // Normal view: show frequency-based arrows for all moves
      const arrows = generateSortedMoveArrows(
        currentNode.children,
        currentNode.stats,
        comparisonResult !== null // Show repertoire colors if compared
      );
      chessboardState.setArrows(arrows);
    } else {
      chessboardState.setArrows([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNode, comparisonResult, selectedDeviation]);

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
      navigateToPosition(deviation.fen);
      // Stay on deviations view so user can see context
    },
    [navigateToPosition, setSelectedDeviation]
  );

  // Handle compare button click
  const handleCompare = useCallback(() => {
    if (studyData.chapters && studyData.chapters.length > 0) {
      compareToRepertoire(studyData.chapters);
    }
  }, [compareToRepertoire, studyData.chapters]);

  // Handle retry after error
  const handleRetry = useCallback(() => {
    reset();
  }, [reset]);

  // Auto-compare when games are loaded and repertoire is available
  useEffect(() => {
    // Only auto-compare if:
    // 1. Games have been loaded (games.length > 0)
    // 2. Repertoire is available (chapters exist)
    // 3. Haven't already compared (comparisonResult is null)
    // 4. Not currently loading
    if (
      games.length > 0 &&
      studyData.chapters &&
      studyData.chapters.length > 0 &&
      comparisonResult === null &&
      !isLoading
    ) {
      console.log("Auto-comparing to repertoire...");
      compareToRepertoire(studyData.chapters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games.length, studyData.chapters?.length, isLoading]);

  // Memoized values
  const hasRepertoire = useMemo(
    () => studyData.chapters && studyData.chapters.length > 0,
    [studyData.chapters]
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

  // Handle color change - also update chessboard orientation
  const handleColorChange = useCallback((color: Color) => {
    setCurrentColor(color);
    // Update chessboard orientation to match the player's perspective
    chessboardState.setOrientation(color);
    // Reset to starting position when switching colors
    navigateToPosition("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  }, [setCurrentColor, chessboardState, navigateToPosition]);

  // Render based on state
  if (isLoading) {
    return <LoadingState />;
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

