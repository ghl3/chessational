import { StudyData } from "@/hooks/UseStudyData";
import Link from "next/link";
import { Dispatch, SetStateAction } from "react";
import { StudyChapterSelector } from "./StudyChapterSelector";

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

export const NavBar: React.FC<{
  mode: Mode;
  setMode: Dispatch<SetStateAction<Mode>>;
  studyData: StudyData;
}> = ({ mode, setMode, studyData }) => {
  return (
    <div>
      <nav className="flex flex-row bg-gray-800 text-white p-4">
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
        <StudyChapterSelector studyData={studyData} />
      </nav>
    </div>
  );
};
