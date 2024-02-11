import { useEffect, useState } from "react";

export const useChessboardSize = (
  defaultSize: number = 400,
  minSize: number = 200,
  maxSize: number = 600,
): number => {
  const [boardSize, setBoardSize] = useState<number>(defaultSize);

  useEffect(() => {
    const getViewportSizes = () => {
      const vw = Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0,
      );
      const vh = Math.max(
        document.documentElement.clientHeight || 0,
        window.innerHeight || 0,
      );
      return [vw, vh];
    };

    const resizeBoard = () => {
      const [vw, vh] = getViewportSizes();

      // The size of the board will be 1/3 of the viewport width or the
      // viewport height minus 250, whichever is smaller. The size will be
      const fraction = 1 / 3;
      let newBoardSize = Math.floor(vw * fraction);
      //let newBoardSize =
      //  Math.floor(Math.min(vw / fraction, vh - 250) / 10) * 10;

      // Apply min and max constraints to the new board size
      newBoardSize = Math.max(Math.min(newBoardSize, maxSize), minSize);

      setBoardSize(newBoardSize);
    };

    resizeBoard();
    window.addEventListener("resize", resizeBoard);

    // Cleanup function to remove event listener on component unmount
    return () => {
      window.removeEventListener("resize", resizeBoard);
    };
  }, [minSize, maxSize]);

  return boardSize;
};
