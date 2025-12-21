import { useEffect, useRef, useState } from "react";

const CHESSBOARD_CONFIG = {
  // Size relative to container width
  WIDTH_RATIO: 1.0,
  // Size boundaries in pixels
  MIN_SIZE: 300,
  MAX_SIZE: 1200,
  // Default size before measurement
  DEFAULT_SIZE: 600,
  // Right panel configuration
  PANEL_WIDTH_PERCENTAGE: 0.45, // 45% of width
  PANEL_MIN_WIDTH: 450,
  // Gaps and paddings (gap-4 = 16px, p-4 = 32px horizontal total, margin safety = 16px)
  HORIZONTAL_OVERHEAD: 64,
  // Vertical overhead (MaterialDiffs + Buttons + Gaps + Container Padding)
  // Board Internal: ~124px. Container Padding: 32px. Total ~156px.
  VERTICAL_OVERHEAD: 160,
  // Minimum size change to trigger update (1px for smooth resizing)
  UPDATE_THRESHOLD: 1,
};

export const useChessboardSize = () => {
  const [boardSize, setBoardSize] = useState(CHESSBOARD_CONFIG.DEFAULT_SIZE);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentSizeRef = useRef(boardSize);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      // We only observe one element
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      // Use window width for breakpoints to match CSS media queries exactly
      const windowWidth = window.innerWidth;

      // Determine panel width based on percentage to ensure smooth scaling
      // Matches: w-full lg:w-[45%] lg:min-w-[450px]
      let panelWidth = 0;
      if (windowWidth >= 1024) {
        panelWidth = Math.max(
          CHESSBOARD_CONFIG.PANEL_MIN_WIDTH,
          windowWidth * CHESSBOARD_CONFIG.PANEL_WIDTH_PERCENTAGE,
        );
      }

      // Calculate available width for the board
      // Available = Container - Panel - Overheads
      const widthLimit =
        width - panelWidth - CHESSBOARD_CONFIG.HORIZONTAL_OVERHEAD;

      // On mobile (windowWidth < 1024), layout is vertical.
      const isMobile = windowWidth < 1024;
      const calculatedWidth = isMobile
        ? width - 32 // simple padding on mobile
        : widthLimit;

      // Calculate available height for the board
      // Available = Container - Overheads
      const heightLimit = height - CHESSBOARD_CONFIG.VERTICAL_OVERHEAD;

      // The board size is constrained by both width and height
      let newSize = Math.min(calculatedWidth, heightLimit);

      // Apply Min/Max constraints
      newSize = Math.max(
        CHESSBOARD_CONFIG.MIN_SIZE,
        Math.min(newSize, CHESSBOARD_CONFIG.MAX_SIZE),
      );

      // Round down to nearest integer to avoid fractional pixel rendering issues
      newSize = Math.floor(newSize);

      // Update state only if change is significant or if it's the first calculation
      if (
        Math.abs(newSize - currentSizeRef.current) >=
        CHESSBOARD_CONFIG.UPDATE_THRESHOLD
      ) {
        currentSizeRef.current = newSize;
        setBoardSize(newSize);
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { boardSize, containerRef };
};
