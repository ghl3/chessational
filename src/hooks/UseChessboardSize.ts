import { useEffect, useRef, useState } from "react";

export const useChessboardSize = () => {
  const [boardSize, setBoardSize] = useState(600); // Smaller default
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.offsetWidth - 16;

      // Use 85% of the available width instead of 98%
      let newSize = Math.floor(containerWidth * 0.85);

      const extraVerticalSpace = 104;
      const availableHeight = window.innerHeight - extraVerticalSpace - 100;

      newSize = Math.min(newSize, availableHeight);

      // Reduced maximum size
      newSize = Math.max(Math.min(newSize, 800), 400);

      newSize = Math.floor(newSize / 8) * 8;

      if (Math.abs(newSize - boardSize) > 8) {
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
