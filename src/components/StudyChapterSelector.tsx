import { Study } from "@/chess/Study";
import { StudyData } from "@/hooks/UseStudyData";

interface StudySelectorProps {
  studies: Study[];
  selectedStudy: Study | null;
  selectStudy: (studyName: string) => void;
}

export const StudySelector: React.FC<StudySelectorProps> = ({
  studies,
  selectedStudy,
  selectStudy,
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <select
        className="w-full p-2 text-white rounded bg-blue-500 hover:bg-blue-700"
        value={selectedStudy ? selectedStudy.name : ""}
        onChange={(e) => {
          const studyName = e.target.value;
          selectStudy(studyName);
        }}
      >
        {studies.map((study) => (
          <option key={study.name} value={study.name}>
            {study.name}
          </option>
        ))}
      </select>
    </div>
  );
};

import CheckboxDropdown, { Option } from "./CheckboxDropdown";

interface ChapterSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  chapters: string[];
  selectedChapters: string[] | null;
  selectChapter: (chapterName: string) => void;
  deselectChapter: (chapterName: string) => void;
}

export const ChapterSelector: React.FC<ChapterSelectorProps> = ({
  chapters,
  selectedChapters,
  selectChapter,
  deselectChapter,
}) => {
  const options: Option[] = chapters.map((chapter) => ({
    value: chapter,
    label: chapter,
  }));

  return (
    <CheckboxDropdown
      text={"Select Chapters"}
      options={options}
      selectedOptions={selectedChapters || []}
      selectOption={selectChapter}
      deselectOption={deselectChapter}
    />
  );
};

export const StudyChapterSelector: React.FC<{
  studyData: StudyData;
  //chapterNames: string[] | null;
  //selectedChapterNames: string[] | null;
}> = ({ studyData }) => {
  const { studies, selectedChapterNames } = studyData;

  if (!studies || studies.length === 0) {
    return null;
  }

  const chapterNames = studyData.chapters
    ? studyData.chapters.map((chapter) => chapter.name)
    : undefined;

  return (
    <div className="flex flex-row bg-gray-800 text-white p-4 space-x-4">
      <div className="flex justify-center space-x-4">
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
      </div>
    </div>
  );
};
