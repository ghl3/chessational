import { Study } from "@/chess/Study";
import { StudyData } from "@/hooks/UseStudyData";
import Selector from "./Selector";

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
    <Selector
      options={studies.map((study) => ({
        value: study.name,
        label: study.name,
      }))}
      selectedValues={selectedStudy ? [selectedStudy.name] : []}
      onChange={(values) => selectStudy(values[0])}
      placeholder="Select a study..."
      multiSelect={false}
      className="w-64"
    />
  );
};

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
  const handleChange = (selectedValues: string[]) => {
    const previouslySelected = selectedChapters || [];
    selectedValues
      .filter((chapter) => !previouslySelected.includes(chapter))
      .forEach(selectChapter);
    previouslySelected
      .filter((chapter) => !selectedValues.includes(chapter))
      .forEach(deselectChapter);
  };

  return (
    <Selector
      options={chapters.map((chapter) => ({
        value: chapter,
        label: chapter,
      }))}
      selectedValues={selectedChapters || []}
      onChange={handleChange}
      placeholder="Select chapters..."
      multiSelect={true}
      className="w-64"
      formatMultipleDisplay={(selected) =>
        selected.length === 0
          ? "No chapters selected"
          : selected.length === 1
          ? "1 chapter selected"
          : `${selected.length} chapters selected`
      }
    />
  );
};

export const StudyChapterSelector: React.FC<{
  studyData: StudyData;
}> = ({ studyData }) => {
  const { studies, selectedChapterNames } = studyData;

  if (!studies || studies.length === 0) {
    return null;
  }

  const chapterNames = studyData.selectedStudyChapters
    ? studyData.selectedStudyChapters.map((chapter) => chapter.name)
    : undefined;

  return (
    <div className="flex flex-wrap gap-2">
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
  );
};
