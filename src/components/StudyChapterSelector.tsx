import { Study } from "@/chess/Study";
import { Chapter } from "@/chess/Chapter";
import { StudyData } from "@/hooks/UseStudyData";
import Selector, { SelectOption } from "./Selector";
import { useMemo, useCallback } from "react";

interface StudySelectorProps {
  studies: Study[];
  selectedStudyNames: string[];
  onStudyChange: (studyNames: string[]) => void;
}

export const StudySelector: React.FC<StudySelectorProps> = ({
  studies,
  selectedStudyNames,
  onStudyChange,
}) => {
  const options: SelectOption[] = useMemo(
    () =>
      studies.map((study) => ({
        value: study.name,
        label: study.name,
      })),
    [studies]
  );

  return (
    <Selector
      options={options}
      selectedValues={selectedStudyNames}
      onChange={onStudyChange}
      placeholder="Select studies..."
      multiSelect={true}
      className="w-64"
      formatMultipleDisplay={(selected) =>
        selected.length === 0
          ? "No studies selected"
          : selected.length === 1
          ? selected[0].label
          : selected.length === studies.length
          ? "All studies"
          : `${selected.length} studies`
      }
    />
  );
};

interface ChapterSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  chapters: Chapter[];
  selectedChapterKeys: string[]; // Format: "studyName|chapterName"
  onChapterChange: (chapterKeys: string[]) => void;
}

export const ChapterSelector: React.FC<ChapterSelectorProps> = ({
  chapters,
  selectedChapterKeys,
  onChapterChange,
}) => {
  // Create options with study groups
  const options: SelectOption[] = useMemo(
    () =>
      chapters.map((chapter) => ({
        value: `${chapter.studyName}|${chapter.name}`,
        label: chapter.name,
        group: chapter.studyName,
      })),
    [chapters]
  );

  return (
    <Selector
      options={options}
      selectedValues={selectedChapterKeys}
      onChange={onChapterChange}
      placeholder="Select chapters..."
      multiSelect={true}
      showGroupHeaders={true}
      className="w-64"
      formatMultipleDisplay={(selected) =>
        selected.length === 0
          ? "No chapters selected"
          : selected.length === 1
          ? selected[0].label
          : selected.length === chapters.length
          ? "All chapters"
          : `${selected.length} chapters`
      }
    />
  );
};

export const StudyChapterSelector: React.FC<{
  studyData: StudyData;
}> = ({ studyData }) => {
  const { studies, selectedStudyNames, selectedStudyChapters } = studyData;

  // Create chapter keys for the selector
  const selectedChapterKeys = useMemo(() => {
    if (!studyData.selectedChapterNames || !selectedStudyChapters) return [];
    
    // We need the full chapter records to build the keys
    // Filter selected chapters that exist in selectedStudyChapters
    return selectedStudyChapters
      .filter((chapter) => studyData.selectedChapterNames?.includes(chapter.name))
      .map((chapter) => `${chapter.studyName}|${chapter.name}`);
  }, [studyData.selectedChapterNames, selectedStudyChapters]);

  const handleStudyChange = useCallback(
    (studyNames: string[]) => {
      studyData.setSelectedStudyNames(studyNames);
    },
    [studyData]
  );

  const handleChapterChange = useCallback(
    (chapterKeys: string[]) => {
      // Parse keys back to { studyName, chapterName }
      const chapters = chapterKeys.map((key) => {
        const [studyName, chapterName] = key.split("|");
        return { studyName, chapterName };
      });
      studyData.setSelectedChapterNames(chapters);
    },
    [studyData]
  );

  if (!studies || studies.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <StudySelector
        studies={studies}
        selectedStudyNames={selectedStudyNames || []}
        onStudyChange={handleStudyChange}
      />
      <ChapterSelector
        chapters={selectedStudyChapters || []}
        selectedChapterKeys={selectedChapterKeys}
        onChapterChange={handleChapterChange}
      />
    </div>
  );
};
