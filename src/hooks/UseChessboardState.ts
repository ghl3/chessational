import { Fen } from "@/chess/Fen";
import { Game } from "@/chess/PgnTree";
import { Position } from "@/chess/Position";
import { useState, useEffect } from "react";

const defaultFen: Fen =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export interface ChessboardState {
  game: Game | null;
  moveIndex: number;
  getPositionFen: () => Fen;
  boardSize: number;
  clearGame: () => void;
  loadGame: (game: Game) => void;
  setPositionFromIndex: (moveIndex: number) => void;
  orientation: "white" | "black";
  setOrientation: React.Dispatch<React.SetStateAction<"white" | "black">>;
}

const useBoardSize = (): number => {
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

export const useChessboardState = (): ChessboardState => {
  const [game, setGame] = useState<Game | null>(null);
  const [moveIndex, setMoveIndex] = useState<number>(0);
  const [position, setPosition] = useState<Position | null>(null);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const boardSize = useBoardSize();

  const loadGame = (game: Game) => {
    setGame(game);
    setPosition(game.positions[0]);
    setMoveIndex(0);
  };

  const setPositionFromIndex = (moveIndex: number) => {
    if (game) {
      setMoveIndex(moveIndex);
      setPosition(game.positions[moveIndex]);
    }
  };

  const getPositionFen = (): Fen => {
    if (position) {
      return position.fen;
    } else {
      return defaultFen;
    }
  };

  const clearGame = () => {
    setGame(null);
    setMoveIndex(0);
    setPosition(null);
  };

  return {
    game,
    moveIndex,
    getPositionFen,
    boardSize,
    clearGame,
    loadGame,
    setPositionFromIndex,
    orientation,
    setOrientation,
  };
};
