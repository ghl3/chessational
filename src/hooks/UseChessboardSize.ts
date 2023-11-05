import { useState, useEffect } from "react";

export const useChessboardSize = (): number => {
  const [boardSize, setBoardSize] = useState<number>(400);

  useEffect(() => {
    const getViewportSizes = () => {
      const vw = Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0
      );
      const vh = Math.max(
        document.documentElement.clientHeight || 0,
        window.innerHeight || 0
      );
      return [vw, vh];
    };

    const resizeBoard = () => {
      const [vw, vh] = getViewportSizes();
      const frac = 3;
      const newBoardSize = Math.floor(Math.min(vw / frac, vh - 250) / 10) * 10;
      setBoardSize(newBoardSize);
    };

    resizeBoard();

    window.addEventListener("resize", resizeBoard);

    return () => {
      window.removeEventListener("resize", resizeBoard);
    };
  }, []);

  return boardSize;
};
