import { useEffect, useRef, useState } from "react";

// Configuration object for easy tweaking
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

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.offsetWidth - 16;

      let newSize = Math.floor(containerWidth * CHESSBOARD_CONFIG.WIDTH_RATIO);

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

      if (Math.abs(newSize - boardSize) > CHESSBOARD_CONFIG.UPDATE_THRESHOLD) {
        setBoardSize(newSize);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, [boardSize]);

  return { boardSize, containerRef };
};
