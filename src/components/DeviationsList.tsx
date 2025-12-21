"use client";

import { Deviation } from "@/utils/RepertoireComparer";
import {
  getWinPercentage,
  getLossPercentage,
} from "@/chess/GamePositionTree";
import React from "react";

interface DeviationsListProps {
  deviations: Deviation[];
  onDeviationClick: (deviation: Deviation) => void;
  selectedDeviation?: Deviation | null;
}

interface DeviationsSummaryProps {
  totalGames: number;
  playerDeviations: number;
  uncoveredLines: number;
}

/**
 * Summary statistics at the top of the deviations panel
 */
export const DeviationsSummary: React.FC<DeviationsSummaryProps> = ({
  totalGames,
  playerDeviations,
  uncoveredLines,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 p-3 bg-gray-800/50 rounded-lg mb-3">
      <div className="text-center">
        <div className="text-lg font-bold text-white">{totalGames}</div>
        <div className="text-xs text-gray-400">Games Analyzed</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-red-400/80">
          {playerDeviations}
        </div>
        <div className="text-xs text-gray-400">Your Deviations</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-amber-400">
          {uncoveredLines}
        </div>
        <div className="text-xs text-gray-400">Uncovered Lines</div>
      </div>
    </div>
  );
};

/**
 * Format move number for display (half-moves to standard notation)
 */
const formatMoveNumber = (halfMove: number): string => {
  const fullMove = Math.ceil(halfMove / 2);
  const isWhiteMove = halfMove % 2 === 1;
  return isWhiteMove ? `${fullMove}.` : `${fullMove}...`;
};

/**
 * Format move number as standard chess notation (e.g., "Move 5" for white, "Move 5..." for black)
 */
const formatMoveContext = (halfMove: number): string => {
  const fullMove = Math.ceil(halfMove / 2);
  const isWhiteMove = halfMove % 2 === 1;
  return `Move ${fullMove}${isWhiteMove ? "" : " (Black)"}`;
};

/**
 * Deviation item - shows all your wrong moves at a single position
 */
const DeviationItem: React.FC<{
  deviations: Deviation[];
  onClick: (deviation: Deviation) => void;
  selectedDeviation?: Deviation | null;
}> = ({ deviations, onClick, selectedDeviation }) => {
  // Use first deviation for common data
  const firstDev = deviations[0];
  const isSelected = deviations.some(d => d === selectedDeviation);
  
  // Aggregate stats across all moves at this position
  const totalOccurrences = deviations.reduce((sum, d) => sum + d.occurrences, 0);
  const totalWins = deviations.reduce((sum, d) => sum + d.stats.wins, 0);
  const totalLosses = deviations.reduce((sum, d) => sum + d.stats.losses, 0);
  const totalGames = deviations.reduce((sum, d) => sum + d.stats.gameCount, 0);
  
  const winPct = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
  const lossPct = totalGames > 0 ? (totalLosses / totalGames) * 100 : 0;

  return (
    <div
      className={`
        p-3 rounded-lg cursor-pointer transition-colors border
        ${
          isSelected
            ? "bg-rose-900/30 border-rose-500"
            : "bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"
        }
      `}
      onClick={() => onClick(firstDev)}
    >
      {/* Header with move number */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-xs font-medium">
          {formatMoveContext(firstDev.moveNumber)}
        </span>
        <span className="text-xs text-gray-500">
          {totalOccurrences}× total
        </span>
      </div>

      {/* Move comparison: Played vs Expected */}
      <div className="space-y-2 mb-2">
        {/* Played moves (incorrect - rose) */}
        <div className="flex items-start gap-2">
          <span className="text-xs text-rose-400 w-16 shrink-0 pt-1">✗ Played:</span>
          <div className="flex flex-wrap gap-1">
            {deviations.map((d, i) => (
              <span 
                key={i} 
                className="font-mono font-bold text-rose-400 text-sm bg-rose-900/20 px-2 py-0.5 rounded"
                title={`${d.occurrences}× played`}
              >
                {d.playedMove.san}
                <span className="text-rose-600 text-xs ml-1">({d.occurrences})</span>
              </span>
            ))}
          </div>
        </div>
        
        {/* Expected moves (correct - emerald) */}
        {firstDev.expectedMoves.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-emerald-400 w-16 shrink-0 pt-1">✓ Correct:</span>
            <div className="flex flex-wrap gap-1">
              {firstDev.expectedMoves.map((m, i) => (
                <span key={i} className="font-mono font-medium text-emerald-400 text-sm bg-emerald-900/20 px-2 py-0.5 rounded">
                  {m.san}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-700/50">
        <div className="flex items-center gap-3">
          <span className="text-teal-400/90">W: {winPct.toFixed(0)}%</span>
          <span className="text-red-400/70">L: {lossPct.toFixed(0)}%</span>
        </div>
        <span className="text-gray-500 italic">
          Click to view
        </span>
      </div>
    </div>
  );
};

/**
 * Normalize FEN for grouping (ignore move counts)
 */
const normalizeFenForGrouping = (fen: string): string => {
  const parts = fen.split(" ");
  return parts.slice(0, 4).join(" ");
};

/**
 * Group deviations by position (FEN)
 */
const groupDeviationsByPosition = (deviations: Deviation[]): Map<string, Deviation[]> => {
  const groups = new Map<string, Deviation[]>();
  for (const deviation of deviations) {
    const key = normalizeFenForGrouping(deviation.fen);
    const existing = groups.get(key) || [];
    existing.push(deviation);
    groups.set(key, existing);
  }
  return groups;
};

/**
 * Gap item - shows all unprepared opponent moves at a single position
 */
const GapItem: React.FC<{
  deviations: Deviation[];
  onClick: (deviation: Deviation) => void;
  selectedDeviation?: Deviation | null;
}> = ({ deviations, onClick, selectedDeviation }) => {
  // Use first deviation for common data
  const firstDev = deviations[0];
  const isSelected = deviations.some(d => d === selectedDeviation);
  
  // Aggregate stats across all moves at this position
  const totalOccurrences = deviations.reduce((sum, d) => sum + d.occurrences, 0);
  const totalWins = deviations.reduce((sum, d) => sum + d.stats.wins, 0);
  const totalLosses = deviations.reduce((sum, d) => sum + d.stats.losses, 0);
  const totalGames = deviations.reduce((sum, d) => sum + d.stats.gameCount, 0);
  
  const winPct = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
  const lossPct = totalGames > 0 ? (totalLosses / totalGames) * 100 : 0;

  return (
    <div
      className={`
        p-3 rounded-lg cursor-pointer transition-colors border
        ${
          isSelected
            ? "bg-amber-900/30 border-amber-500"
            : "bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"
        }
      `}
      onClick={() => onClick(firstDev)}
    >
      {/* Header with move number */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-xs font-medium">
          {formatMoveContext(firstDev.moveNumber)}
        </span>
        <span className="text-xs text-gray-500">
          {totalOccurrences}× total
        </span>
      </div>

      {/* Unprepared moves (what opponent played that we didn't prepare for) */}
      <div className="space-y-2 mb-2">
        <div className="flex items-start gap-2">
          <span className="text-xs text-amber-400 w-20 shrink-0 pt-1">⚠ Unprepared:</span>
          <div className="flex flex-wrap gap-1">
            {deviations.map((d, i) => (
              <span 
                key={i} 
                className="font-mono font-bold text-amber-400 text-sm bg-amber-900/20 px-2 py-0.5 rounded"
                title={`${d.occurrences}× played`}
              >
                {d.playedMove.san}
                <span className="text-amber-600 text-xs ml-1">({d.occurrences})</span>
              </span>
            ))}
          </div>
        </div>
        
        {/* What was prepared (emerald) */}
        {firstDev.expectedMoves.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-emerald-400 w-20 shrink-0 pt-1">✓ Prepared:</span>
            <div className="flex flex-wrap gap-1">
              {firstDev.expectedMoves.map((m, i) => (
                <span key={i} className="font-mono font-medium text-emerald-400 text-sm bg-emerald-900/20 px-2 py-0.5 rounded">
                  {m.san}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-700/50">
        <div className="flex items-center gap-3">
          <span className="text-teal-400/90">W: {winPct.toFixed(0)}%</span>
          <span className="text-red-400/70">L: {lossPct.toFixed(0)}%</span>
        </div>
        <span className="text-gray-500 italic">
          Click to view position
        </span>
      </div>
    </div>
  );
};

/**
 * List of YOUR deviations from the repertoire (mistakes you made), grouped by position
 */
export const DeviationsList: React.FC<DeviationsListProps> = ({
  deviations,
  onDeviationClick,
  selectedDeviation,
}) => {
  // Only show player deviations in this list
  const playerDeviations = deviations.filter((d) => d.deviatedBy === "player");

  if (playerDeviations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">✓</div>
        <div>No deviations found!</div>
        <div className="text-sm mt-1">
          You followed your repertoire perfectly.
        </div>
      </div>
    );
  }

  // Group by position
  const grouped = groupDeviationsByPosition(playerDeviations);
  const sortedGroups = Array.from(grouped.entries())
    .sort((a, b) => {
      // Sort by total occurrences descending
      const aTotal = a[1].reduce((sum, d) => sum + d.occurrences, 0);
      const bTotal = b[1].reduce((sum, d) => sum + d.occurrences, 0);
      return bTotal - aTotal;
    });

  return (
    <div className="space-y-2 overflow-auto">
      <p className="text-xs text-gray-500 mb-3">
        Positions where you played a different move than your repertoire suggests.
      </p>
      {sortedGroups.map(([fen, devsAtPosition]) => (
        <DeviationItem
          key={`deviation-${fen}`}
          deviations={devsAtPosition}
          onClick={onDeviationClick}
          selectedDeviation={selectedDeviation}
        />
      ))}
    </div>
  );
};

/**
 * List of gaps - opponent moves outside your repertoire, grouped by position
 */
export const GapsList: React.FC<DeviationsListProps> = ({
  deviations,
  onDeviationClick,
  selectedDeviation,
}) => {
  // Only show opponent deviations (gaps)
  const gaps = deviations.filter((d) => d.deviatedBy === "opponent");

  if (gaps.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">📚</div>
        <div>Full coverage!</div>
        <div className="text-sm mt-1">
          All opponent moves were covered by your repertoire.
        </div>
      </div>
    );
  }

  // Group by position
  const grouped = groupDeviationsByPosition(gaps);
  const sortedGroups = Array.from(grouped.entries())
    .sort((a, b) => {
      // Sort by total occurrences descending
      const aTotal = a[1].reduce((sum, d) => sum + d.occurrences, 0);
      const bTotal = b[1].reduce((sum, d) => sum + d.occurrences, 0);
      return bTotal - aTotal;
    });

  return (
    <div className="space-y-2 overflow-auto">
      {sortedGroups.map(([fen, devsAtPosition]) => (
        <GapItem
          key={`gap-${fen}`}
          deviations={devsAtPosition}
          onClick={onDeviationClick}
          selectedDeviation={selectedDeviation}
        />
      ))}
    </div>
  );
};

// Keep old name as alias for compatibility
export const UncoveredLinesList = GapsList;

export default DeviationsList;

