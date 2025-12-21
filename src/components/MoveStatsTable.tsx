"use client";

import {
  GamePositionNode,
  GameStats,
  getMoveFrequency,
  getWinPercentage,
  getDrawPercentage,
  getLossPercentage,
  sortByPopularity,
} from "@/chess/GamePositionTree";
import React from "react";

interface MoveStatsTableProps {
  nodes: GamePositionNode[];
  parentStats: GameStats;
  onMoveClick: (node: GamePositionNode) => void;
  selectedMove?: string | null;
}

/**
 * Format a number for display (e.g., 1234567 -> "1.2M")
 */
const formatGameCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

/**
 * Result bar showing win/draw/loss percentages
 */
const ResultBar: React.FC<{ stats: GameStats }> = ({ stats }) => {
  const winPct = getWinPercentage(stats);
  const drawPct = getDrawPercentage(stats);
  const lossPct = getLossPercentage(stats);

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-3 w-24 rounded overflow-hidden bg-gray-700">
        {/* Win (green) */}
        <div
          className="bg-green-500 h-full"
          style={{ width: `${winPct}%` }}
          title={`Wins: ${winPct.toFixed(1)}%`}
        />
        {/* Draw (gray) */}
        <div
          className="bg-gray-400 h-full"
          style={{ width: `${drawPct}%` }}
          title={`Draws: ${drawPct.toFixed(1)}%`}
        />
        {/* Loss (red) */}
        <div
          className="bg-red-500 h-full"
          style={{ width: `${lossPct}%` }}
          title={`Losses: ${lossPct.toFixed(1)}%`}
        />
      </div>
      <span className="text-xs text-gray-400 w-20 text-right">
        {winPct.toFixed(0)}% / {lossPct.toFixed(0)}%
      </span>
    </div>
  );
};

/**
 * Repertoire indicator badge
 */
const RepertoireBadge: React.FC<{ inRepertoire: boolean }> = ({
  inRepertoire,
}) => {
  if (inRepertoire) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-900 text-green-300">
        Rep
      </span>
    );
  }
  return null;
};

/**
 * Single row in the move stats table
 */
const MoveRow: React.FC<{
  node: GamePositionNode;
  parentStats: GameStats;
  onClick: () => void;
  isSelected: boolean;
}> = ({ node, parentStats, onClick, isSelected }) => {
  const frequency = getMoveFrequency(node.stats, parentStats);
  const move = node.move;

  if (!move) return null;

  return (
    <tr
      className={`
        cursor-pointer transition-colors
        ${isSelected ? "bg-blue-900/50" : "hover:bg-gray-700/50"}
        ${!node.inRepertoire ? "opacity-80" : ""}
      `}
      onClick={onClick}
    >
      {/* Move */}
      <td className="px-3 py-2 font-mono font-semibold text-white">
        <div className="flex items-center gap-2">
          {move.san}
          <RepertoireBadge inRepertoire={node.inRepertoire} />
        </div>
      </td>

      {/* Games */}
      <td className="px-3 py-2 text-gray-300 text-sm">
        <div className="flex items-center gap-1">
          <span>{formatGameCount(node.stats.gameCount)}</span>
          <span className="text-gray-500 text-xs">
            ({frequency.toFixed(0)}%)
          </span>
        </div>
      </td>

      {/* Result */}
      <td className="px-3 py-2">
        <ResultBar stats={node.stats} />
      </td>
    </tr>
  );
};

/**
 * Table showing move statistics at the current position
 */
export const MoveStatsTable: React.FC<MoveStatsTableProps> = ({
  nodes,
  parentStats,
  onMoveClick,
  selectedMove,
}) => {
  // Sort by popularity
  const sortedChildren = sortByPopularity(nodes);

  if (sortedChildren.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No moves found at this position
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-left">
        <thead className="text-xs uppercase text-gray-400 bg-gray-800/50 sticky top-0">
          <tr>
            <th className="px-3 py-2">Move</th>
            <th className="px-3 py-2">Games</th>
            <th className="px-3 py-2">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {sortedChildren.map((node) => (
            <MoveRow
              key={node.move?.san || node.position.fen}
              node={node}
              parentStats={parentStats}
              onClick={() => onMoveClick(node)}
              isSelected={selectedMove === node.move?.san}
            />
          ))}
        </tbody>
      </table>

      {/* Summary footer */}
      <div className="border-t border-gray-700 px-3 py-2 text-xs text-gray-400 bg-gray-800/30">
        Total: {formatGameCount(parentStats.gameCount)} games •{" "}
        {sortedChildren.length} different moves
      </div>
    </div>
  );
};

export default MoveStatsTable;

