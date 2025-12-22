"use client";

import { useEffect, useRef } from "react";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { Arrow } from "@/components/Chessboard";
import {
  GamePositionTree,
  GamePositionNode,
  findPathToFen,
  getMostCommonChild,
} from "@/chess/GamePositionTree";
import {
  generateSortedMoveArrows,
  generateDeviationArrows,
  generateUncoveredArrows,
  getDeviationsAtPosition,
} from "@/components/MoveArrows";
import { ComparisonResult, Deviation } from "@/utils/RepertoireComparer";
import { Fen } from "@/chess/Fen";
import { Color } from "chess.js";

interface UseGamesChessboardSyncProps {
  chessboardState: ChessboardState;
  gameTree: GamePositionTree;
  currentFen: Fen;
  currentColor: Color;
  currentNode: GamePositionNode | null;
  comparisonResult: ComparisonResult | null;
  selectedDeviation: Deviation | null;
  navigateToPosition: (fen: Fen) => void;
  setSelectedDeviation: (deviation: Deviation | null) => void;
}

interface UseGamesChessboardSyncResult {
  currentPath: GamePositionNode[];
}

/**
 * Custom hook that handles bidirectional synchronization between
 * the game review state and the chessboard state.
 * 
 * Responsibilities:
 * 1. Sync chessboard positions when game tree navigation changes
 * 2. Sync game review state when chessboard arrows navigate
 * 3. Update arrows based on current position and selection
 * 4. Sync board orientation with current color
 */
export const useGamesChessboardSync = ({
  chessboardState,
  gameTree,
  currentFen,
  currentColor,
  currentNode,
  comparisonResult,
  selectedDeviation,
  navigateToPosition,
  setSelectedDeviation,
}: UseGamesChessboardSyncProps): UseGamesChessboardSyncResult => {
  // Track the current path through the game tree for chessboard sync
  const currentPathRef = useRef<GamePositionNode[]>([]);
  
  // Refs to prevent sync loops between game review state and chessboard
  const isSyncingFromGameStateRef = useRef(false);
  const lastSyncedFenRef = useRef<string | null>(null);
  const lastSyncedTreeSizeRef = useRef<number>(0);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Use refs for functions to avoid dependency issues
  const chessboardStateRef = useRef(chessboardState);
  chessboardStateRef.current = chessboardState;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Effect 0: Sync board orientation with current color
  useEffect(() => {
    chessboardStateRef.current.setOrientation(currentColor);
  }, [currentColor]);

  // Effect 1: Sync chessboard when game tree position changes
  useEffect(() => {
    if (!gameTree || !currentFen) return;
    
    // Count tree size to detect when tree changes (e.g., when games are loaded)
    const treeSize = gameTree.children.length;
    
    // Skip if FEN hasn't changed AND tree hasn't changed
    if (
      lastSyncedFenRef.current === currentFen &&
      lastSyncedTreeSizeRef.current === treeSize
    ) {
      return;
    }
    
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
    
    currentPathRef.current = extendedPath;
    lastSyncedFenRef.current = currentFen;
    lastSyncedTreeSizeRef.current = treeSize;
    
    // Mark that we're syncing from game state to prevent loop
    isSyncingFromGameStateRef.current = true;
    
    // Load all positions into chessboard, index at current position (not end)
    const positions = extendedPath.map(node => node.position);
    const currentIndex = pathToPosition.length - 1;
    chessboardStateRef.current.clearAndSetPositions(positions, currentIndex);
    
    // Reset flag after a short delay to allow chessboard to update
    // Clear any existing timeout first
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      isSyncingFromGameStateRef.current = false;
      syncTimeoutRef.current = null;
    }, 50);
  }, [currentFen, gameTree]);

  // Effect 2: Sync game review state when chessboard navigates via arrows
  // We need to track chessboard position changes
  const chessboardPositionIndex = chessboardState.currentPositionIndex;
  const chessboardPositionsLength = chessboardState.positions.length;
  
  useEffect(() => {
    // Skip if we're currently syncing from game state
    if (isSyncingFromGameStateRef.current) return;
    
    const currentPath = currentPathRef.current;
    
    // Only handle if we have a path and the chessboard has positions
    if (currentPath.length === 0 || chessboardPositionsLength === 0) {
      return;
    }
    
    // If the chessboard index corresponds to a different node in our path, sync it
    if (chessboardPositionIndex >= 0 && chessboardPositionIndex < currentPath.length) {
      const nodeAtIndex = currentPath[chessboardPositionIndex];
      if (nodeAtIndex && nodeAtIndex.position.fen !== currentFen) {
        // Clear selected deviation when navigating
        setSelectedDeviation(null);
        // Update the lastSyncedFen before navigating to prevent double-sync
        lastSyncedFenRef.current = nodeAtIndex.position.fen;
        navigateToPosition(nodeAtIndex.position.fen);
      }
    }
  }, [
    chessboardPositionIndex,
    chessboardPositionsLength,
    currentFen,
    navigateToPosition,
    setSelectedDeviation,
  ]);

  // Effect 3: Update arrows based on current position and selection
  useEffect(() => {
    let arrows: Arrow[] = [];
    
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
      arrows = selectedDeviation.deviatedBy === "player"
        ? generateDeviationArrows(itemsAtPosition, lastMove)
        : generateUncoveredArrows(itemsAtPosition, lastMove);
    } else if (currentNode && currentNode.children.length > 0) {
      // Normal view: show frequency-based arrows for all moves
      arrows = generateSortedMoveArrows(
        currentNode.children,
        currentNode.stats,
        comparisonResult !== null // Show repertoire colors if compared
      );
    }
    
    // Use the ref to call setArrows to avoid infinite loop
    chessboardStateRef.current.setArrows(arrows);
  }, [currentNode, comparisonResult, selectedDeviation]);

  return {
    currentPath: currentPathRef.current,
  };
};
