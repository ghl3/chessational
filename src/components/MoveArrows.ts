import { Arrow } from "./Chessboard";
import { GamePositionNode, getMoveFrequency, GameStats } from "@/chess/GamePositionTree";
import { Move } from "@/chess/Move";
import { Deviation } from "@/utils/RepertoireComparer";
import { normalizeFen } from "@/chess/Fen";

/**
 * Color configuration for arrows based on move frequency
 */
interface ArrowColorConfig {
  // Base color (RGB without alpha)
  baseColor: { r: number; g: number; b: number };
  // Minimum opacity for least frequent moves
  minOpacity: number;
  // Maximum opacity for most frequent moves
  maxOpacity: number;
}

// Default color schemes
export const ARROW_COLORS = {
  // Green for repertoire/expected moves
  repertoire: {
    baseColor: { r: 34, g: 197, b: 94 }, // Brighter green
    minOpacity: 0.3,
    maxOpacity: 0.9,
  },
  // Red for deviations/incorrect moves
  deviation: {
    baseColor: { r: 239, g: 68, b: 68 }, // Red
    minOpacity: 0.3,
    maxOpacity: 0.9,
  },
  // Blue for opponent's last move
  lastMove: {
    baseColor: { r: 59, g: 130, b: 246 }, // Blue
    minOpacity: 0.6,
    maxOpacity: 0.8,
  },
  // Orange for neutral (when no repertoire comparison)
  neutral: {
    baseColor: { r: 251, g: 146, b: 60 }, // Orange
    minOpacity: 0.3,
    maxOpacity: 0.9,
  },
};

/**
 * Calculate opacity based on move frequency
 */
const calculateOpacity = (
  frequency: number,
  config: ArrowColorConfig
): number => {
  // Frequency is 0-100%
  // Map to opacity range
  const range = config.maxOpacity - config.minOpacity;
  return config.minOpacity + (frequency / 100) * range;
};

/**
 * Create an RGBA color string
 */
const createRgbaColor = (
  color: { r: number; g: number; b: number },
  opacity: number
): string => {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
};

/**
 * Generate arrows for all moves at a position, with opacity based on frequency
 */
export const generateMoveArrows = (
  children: GamePositionNode[],
  parentStats: GameStats,
  showRepertoireColors: boolean = true
): Arrow[] => {
  if (children.length === 0) {
    return [];
  }

  return children
    .filter((child) => child.move !== null)
    .map((child) => {
      const move = child.move!;
      const frequency = getMoveFrequency(child.stats, parentStats);

      // Choose color based on whether move is in repertoire
      let colorConfig: ArrowColorConfig;
      if (showRepertoireColors) {
        colorConfig = child.inRepertoire
          ? ARROW_COLORS.repertoire
          : ARROW_COLORS.deviation;
      } else {
        colorConfig = ARROW_COLORS.neutral;
      }

      const opacity = calculateOpacity(frequency, colorConfig);
      const color = createRgbaColor(colorConfig.baseColor, opacity);

      return {
        from: move.from,
        to: move.to,
        color,
      };
    });
};

/**
 * Generate arrows sorted by frequency (most frequent first, for layering)
 */
export const generateSortedMoveArrows = (
  children: GamePositionNode[],
  parentStats: GameStats,
  showRepertoireColors: boolean = true
): Arrow[] => {
  const arrows = generateMoveArrows(children, parentStats, showRepertoireColors);

  // Sort by frequency (least frequent first so most frequent are on top)
  return arrows.sort((a, b) => {
    // Extract opacity from rgba string
    const opacityA = parseFloat(a.color?.match(/[\d.]+(?=\)$)/)?.[0] || "0");
    const opacityB = parseFloat(b.color?.match(/[\d.]+(?=\)$)/)?.[0] || "0");
    return opacityA - opacityB;
  });
};

/**
 * Generate a single arrow for a highlighted move
 */
export const generateHighlightArrow = (
  from: string,
  to: string,
  isRepertoire: boolean = false
): Arrow => {
  const color = isRepertoire
    ? createRgbaColor(ARROW_COLORS.repertoire.baseColor, 1.0)
    : createRgbaColor(ARROW_COLORS.deviation.baseColor, 1.0);

  return {
    from: from as Arrow["from"],
    to: to as Arrow["to"],
    color,
  };
};

// Arrow priority for deduplication (higher = more important, wins conflicts)
type ArrowPriority = "lastMove" | "expected" | "deviation";

const ARROW_PRIORITY: Record<ArrowPriority, number> = {
  lastMove: 1,
  expected: 2,
  deviation: 3,
};

interface PrioritizedArrow extends Arrow {
  priority: ArrowPriority;
}

/**
 * Generate arrows for a deviation view showing ALL deviations at a position:
 * - Blue arrow for opponent's last move (how we got here)
 * - Green arrows for expected/correct moves from repertoire
 * - Red arrows for ALL deviation moves with opacity based on relative frequency
 * 
 * Deduplicates arrows by from-to, keeping the highest priority arrow.
 * 
 * @param deviationsAtPosition - All deviations that occurred at this position
 * @param lastOpponentMove - The move that led to this position
 */
export const generateDeviationArrows = (
  deviationsAtPosition: Deviation[],
  lastOpponentMove?: Move | null
): Arrow[] => {
  if (deviationsAtPosition.length === 0) {
    return [];
  }

  // Use a map to dedupe arrows by from-to key, keeping highest priority
  const arrowMap = new Map<string, PrioritizedArrow>();

  const addArrow = (arrow: PrioritizedArrow) => {
    const key = `${arrow.from}-${arrow.to}`;
    const existing = arrowMap.get(key);
    if (!existing || ARROW_PRIORITY[arrow.priority] > ARROW_PRIORITY[existing.priority]) {
      arrowMap.set(key, arrow);
    }
  };

  // Blue arrow for opponent's last move (if any) - lowest priority
  if (lastOpponentMove) {
    addArrow({
      from: lastOpponentMove.from as Arrow["from"],
      to: lastOpponentMove.to as Arrow["to"],
      color: createRgbaColor(ARROW_COLORS.lastMove.baseColor, 0.7),
      priority: "lastMove",
    });
  }

  // Green arrows for expected moves from repertoire - medium priority
  for (const deviation of deviationsAtPosition) {
    for (const expectedMove of deviation.expectedMoves) {
      addArrow({
        from: expectedMove.from as Arrow["from"],
        to: expectedMove.to as Arrow["to"],
        color: createRgbaColor(ARROW_COLORS.repertoire.baseColor, 0.85),
        priority: "expected",
      });
    }
  }

  // Calculate total occurrences for proportional opacity
  const totalOccurrences = deviationsAtPosition.reduce(
    (sum, d) => sum + d.occurrences,
    0
  );

  // Red arrows for ALL deviation moves - highest priority
  // Sort by occurrences (least first) so most frequent are processed last (and win ties)
  const sortedDeviations = [...deviationsAtPosition].sort(
    (a, b) => a.occurrences - b.occurrences
  );

  for (const deviation of sortedDeviations) {
    // Calculate opacity: min 0.4, max 0.95, scaled by proportion
    const proportion = deviation.occurrences / totalOccurrences;
    const minOpacity = 0.4;
    const maxOpacity = 0.95;
    const opacity = minOpacity + proportion * (maxOpacity - minOpacity);

    addArrow({
      from: deviation.playedMove.from as Arrow["from"],
      to: deviation.playedMove.to as Arrow["to"],
      color: createRgbaColor(ARROW_COLORS.deviation.baseColor, opacity),
      priority: "deviation",
    });
  }

  // Convert map to array, stripping priority field
  return Array.from(arrowMap.values()).map(({ priority, ...arrow }) => arrow);
};

/**
 * Generate arrows for an UNCOVERED LINE view:
 * - Blue arrow for the last move (how we got here)
 * - Green arrows for moves that ARE prepared in repertoire
 * - Amber arrows for opponent moves that were NOT prepared
 * 
 * @param uncoveredAtPosition - All uncovered lines at this position
 * @param lastMove - The move that led to this position
 */
export const generateUncoveredArrows = (
  uncoveredAtPosition: Deviation[],
  lastMove?: Move | null
): Arrow[] => {
  if (uncoveredAtPosition.length === 0) {
    return [];
  }

  const arrowMap = new Map<string, PrioritizedArrow>();

  const addArrow = (arrow: PrioritizedArrow) => {
    const key = `${arrow.from}-${arrow.to}`;
    const existing = arrowMap.get(key);
    if (!existing || ARROW_PRIORITY[arrow.priority] > ARROW_PRIORITY[existing.priority]) {
      arrowMap.set(key, arrow);
    }
  };

  // Blue arrow for the last move (if any) - lowest priority
  if (lastMove) {
    addArrow({
      from: lastMove.from as Arrow["from"],
      to: lastMove.to as Arrow["to"],
      color: createRgbaColor(ARROW_COLORS.lastMove.baseColor, 0.7),
      priority: "lastMove",
    });
  }

  // Green arrows for moves that ARE prepared (expected moves in repertoire)
  for (const uncovered of uncoveredAtPosition) {
    for (const preparedMove of uncovered.expectedMoves) {
      addArrow({
        from: preparedMove.from as Arrow["from"],
        to: preparedMove.to as Arrow["to"],
        color: createRgbaColor(ARROW_COLORS.repertoire.baseColor, 0.85),
        priority: "expected",
      });
    }
  }

  // Calculate total occurrences for proportional opacity
  const totalOccurrences = uncoveredAtPosition.reduce(
    (sum, d) => sum + d.occurrences,
    0
  );

  // Amber arrows for opponent moves that were NOT prepared
  const sortedUncovered = [...uncoveredAtPosition].sort(
    (a, b) => a.occurrences - b.occurrences
  );

  for (const uncovered of sortedUncovered) {
    const proportion = uncovered.occurrences / totalOccurrences;
    const minOpacity = 0.5;
    const maxOpacity = 0.95;
    const opacity = minOpacity + proportion * (maxOpacity - minOpacity);

    addArrow({
      from: uncovered.playedMove.from as Arrow["from"],
      to: uncovered.playedMove.to as Arrow["to"],
      // Use amber/orange for uncovered opponent moves (different from red for player deviations)
      color: createRgbaColor(ARROW_COLORS.neutral.baseColor, opacity),
      priority: "deviation",
    });
  }

  return Array.from(arrowMap.values()).map(({ priority, ...arrow }) => arrow);
};

/**
 * Filter deviations to find all that occurred at a specific FEN position
 */
export const getDeviationsAtPosition = (
  allDeviations: Deviation[],
  fen: string
): Deviation[] => {
  const normalizedTarget = normalizeFen(fen);
  return allDeviations.filter(
    (d) => normalizeFen(d.fen) === normalizedTarget
  );
};

