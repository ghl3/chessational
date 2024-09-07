import { StudyData } from "@/hooks/UseStudyData";
import { Dispatch, SetStateAction } from "react";
import { ChapterSelector } from "./ChapterSelector";
import { StudySelector } from "./StudySelector";

export type Mode =
  | "REVIEW"
  | "EXPLORE"
  | "SEARCH"
  | "STATS"
  | "STUDIES"
  | "TREE";

const NavEntry: React.FC<{
  name: string;
  mode: Mode;
  currentMode: Mode;
  setMode: Dispatch<SetStateAction<Mode>>;
}> = ({ name, mode, setMode, currentMode }) => {
  const active = mode === currentMode;
  return (
    <li className={active ? "border-b-2 border-blue-500" : ""}>
      <button
        key={name}
        onClick={() => setMode(mode)}
        className="hover:text-blue-300 transition duration-300"
      >
        {name}
      </button>
    </li>
  );
};

export const NavBar: React.FC<{
  mode: Mode;
  setMode: Dispatch<SetStateAction<Mode>>;
  studyData: StudyData;
}> = ({ mode, setMode, studyData }) => {
  const { studies, selectedChapterNames } = studyData;

  const chapterNames = studyData.chapters
    ? studyData.chapters.map((chapter) => chapter.name)
    : undefined;
  return (
    <div>
      <nav className="flex flex-row bg-gray-800 text-white p-4 space-x-4">
        <ul className="flex justify-center space-x-4">
          <NavEntry
            name="Studies"
            mode="STUDIES"
            currentMode={mode}
            setMode={setMode}
          />
          <NavEntry
            name="Review"
            mode="REVIEW"
            currentMode={mode}
            setMode={setMode}
          />
          <NavEntry
            name="Explore"
            mode="EXPLORE"
            currentMode={mode}
            setMode={setMode}
          />
          <NavEntry
            name="Search"
            mode="SEARCH"
            currentMode={mode}
            setMode={setMode}
          />
          <NavEntry
            name="Stats"
            mode="STATS"
            currentMode={mode}
            setMode={setMode}
          />
          <NavEntry
            name="Tree"
            mode="TREE"
            currentMode={mode}
            setMode={setMode}
          />
        </ul>

        {studies && studies.length > 0 && (
          <>
            <StudySelector
              studies={studyData.studies}
              selectedStudy={studyData.selectedStudy || null}
              selectStudy={studyData.selectStudy}
            />
            <ChapterSelector
              chapters={chapterNames || []}
              selectedChapters={selectedChapterNames || null}
              selectChapter={studyData.addSelectedChapterName}
              deselectChapter={studyData.removeSelectedChapterName}
            />
          </>
        )}
      </nav>
    </div>
  );
};
