import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { CurrentLineData } from "@/hooks/UseCurrentLineData";
import { ReviewState } from "@/hooks/UseReviewState";
import Link from "next/link";
import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { MoveValidator } from "./Chessboard";
import { Explore } from "./Explore";
import { ReviewLine } from "./ReviewLine";

export type Mode = "REVIEW" | "EXPLORE" | "SEARCH" | "STATS";

const NavEntry: React.FC<{
  name: string;
  mode: Mode;
  currentMode: Mode;
  setCurrentMode: Dispatch<SetStateAction<Mode>>;
}> = ({ name, mode, currentMode, setCurrentMode }) => {
  const active = mode === currentMode;
  return (
    <li className={active ? "border-b-2 border-blue-500" : ""}>
      <Link
        href="#"
        onClick={() => setCurrentMode(mode)}
        className="hover:text-blue-300 transition duration-300"
      >
        {name}
      </Link>
    </li>
  );
};

const NavBar: React.FC<{
  mode: Mode;
  setMode: Dispatch<SetStateAction<Mode>>;
}> = ({ mode, setMode }) => {
  //const pathname = usePathname();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <ul className="flex justify-center space-x-4">
        <NavEntry
          name="Review"
          mode="REVIEW"
          currentMode={mode}
          setCurrentMode={setMode}
        />
        <NavEntry
          name="Explore"
          mode="EXPLORE"
          currentMode={mode}
          setCurrentMode={setMode}
        />
        <NavEntry
          name="Search"
          mode="SEARCH"
          currentMode={mode}
          setCurrentMode={setMode}
        />
        <NavEntry
          name="Stats"
          mode="STATS"
          currentMode={mode}
          setCurrentMode={setMode}
        />
      </ul>
    </nav>
  );
};

export interface InteractiveAreaProps {
  mode: Mode;
  setMode: Dispatch<SetStateAction<Mode>>;
  chessboardState: ChessboardState;
  onValidPieceDropRef: MutableRefObject<MoveValidator | null>;
  currentLineData: CurrentLineData;
  reviewState: ReviewState;

  height?: number;
}

export const InteractiveArea: React.FC<InteractiveAreaProps> = ({
  mode,
  setMode,
  chessboardState,
  onValidPieceDropRef,
  currentLineData,
  reviewState,

  height,
}) => {
  return (
    <div className="flex flex-col flex-1 justify-start ml-3">
      <NavBar mode={mode} setMode={setMode} />
      {mode === "REVIEW" && (
        <ReviewLine
          chessboardState={chessboardState}
          onValidPieceDropRef={onValidPieceDropRef}
          currentLineData={currentLineData}
          reviewState={reviewState}
          height={height || 0}
        />
      )}
      {mode === "EXPLORE" && (
        <Explore
          chessboardState={chessboardState}
          onValidPieceDropRef={onValidPieceDropRef}
          height={height || 0}
          currentLineData={currentLineData}
        />
      )}
      {mode === "SEARCH" && <div>Search</div>}
      {mode === "STATS" && <div>Stats</div>}
    </div>
  );
};
