import { useEffect, useRef, useState } from "react";

const CHESSBOARD_CONFIG = {
  // Size boundaries in pixels
  MIN_SIZE: 300,
  MAX_SIZE: 1200,
  // Default size before measurement
  DEFAULT_SIZE: 600,
  // Vertical overhead inside the chessboard wrapper:
  // MaterialDiff top (h-6 = 24px) + MaterialDiff bottom (24px) + ChessboardButtons (~40px)
  // + gaps (gap-3 = 12px × 3 = 36px) + container padding (p-4 = 32px) = ~156px
  VERTICAL_OVERHEAD: 156,
  // Horizontal padding inside the board container (p-4 = 32px)
  HORIZONTAL_PADDING: 32,
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
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;

      // Available width for the board (container width minus padding for the board wrapper)
      const availableWidth = width - CHESSBOARD_CONFIG.HORIZONTAL_PADDING;

      // Available height for the board (container height minus vertical overhead)
      const availableHeight = height - CHESSBOARD_CONFIG.VERTICAL_OVERHEAD;

      // The board must be square, so take the smaller of width and height
      let newSize = Math.min(availableWidth, availableHeight);

      // Apply min/max constraints
      newSize = Math.max(
        CHESSBOARD_CONFIG.MIN_SIZE,
        Math.min(newSize, CHESSBOARD_CONFIG.MAX_SIZE),
      );

      // Round down to avoid fractional pixel issues
      newSize = Math.floor(newSize);

      // Only update if change is significant
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
