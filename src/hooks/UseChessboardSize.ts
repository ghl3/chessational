import { useEffect, useRef, useState } from "react";

const CHESSBOARD_CONFIG = {
  // Size relative to container width (0.85 = 85%)
  WIDTH_RATIO: 0.92,
  // Size boundaries in pixels
  MIN_SIZE: 400,
  MAX_SIZE: 800,
  // Default size before measurement
  DEFAULT_SIZE: 600,
  // Extra space needed for MaterialDiff and buttons
  EXTRA_VERTICAL_SPACE: 104,
  // Additional padding reserve
  PADDING_RESERVE: 100,
  // Minimum size change to trigger update
  UPDATE_THRESHOLD: 8,
};

export const useChessboardSize = () => {
  const [boardSize, setBoardSize] = useState(CHESSBOARD_CONFIG.DEFAULT_SIZE);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentSizeRef = useRef(boardSize);

  useEffect(() => {
    const updateSize = () => {
      const availableWidth = window.innerWidth;
      // Reserve space for the right panel (700px) + gap (16px) + padding (32px) + minimal left margin (16px)
      const widthLimit = availableWidth - 764; 

      // If width is small (mobile), we use full width minus padding
      const isMobile = availableWidth < 1024; // lg breakpoint
      let newSize = isMobile 
        ? Math.floor((availableWidth - 32) * CHESSBOARD_CONFIG.WIDTH_RATIO)
        : Math.floor(widthLimit);

      const availableHeight =
        window.innerHeight -
        CHESSBOARD_CONFIG.EXTRA_VERTICAL_SPACE -
        CHESSBOARD_CONFIG.PADDING_RESERVE;

      newSize = Math.min(newSize, availableHeight);
      newSize = Math.max(
        Math.min(newSize, CHESSBOARD_CONFIG.MAX_SIZE),
        CHESSBOARD_CONFIG.MIN_SIZE,
      );

      newSize = Math.floor(newSize / 8) * 8;

      if (Math.abs(newSize - currentSizeRef.current) > CHESSBOARD_CONFIG.UPDATE_THRESHOLD) {
        currentSizeRef.current = newSize;
        setBoardSize(newSize);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return { boardSize, containerRef: null }; // containerRef no longer needed but keeping signature
};
