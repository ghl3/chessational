"use client";

import { Study } from "@/chess/Study";
import { fetchStudy } from "@/utils/StudyFetcher";
import { useCallback } from "react";

interface StudyRefresherProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedStudy?: Study;
  setStudies: React.Dispatch<React.SetStateAction<Study[]>>;
  setSelectedStudyName: React.Dispatch<
    React.SetStateAction<string | undefined>
  >;
  selectedChapterNames: string[];
  setSelectedChapterNames: React.Dispatch<React.SetStateAction<string[]>>;
}

export const StudyRefresher: React.FC<StudyRefresherProps> = ({
  selectedStudy,
  setStudies,
  setSelectedStudyName,
  selectedChapterNames,
  setSelectedChapterNames,
}) => {
  const refreshStudy = useCallback(
    async (study: Study) => {
      const updatedStudy = await fetchStudy(study.url);

      if (updatedStudy.chapters.length === 0) {
        throw new Error("Study has no chapters");
      }

      setStudies((prevStudies) => {
        const newStudies = prevStudies.filter(
          (prevStudy) => prevStudy.name !== study.name,
        );
        return [...newStudies, updatedStudy];
      });
      setSelectedStudyName(updatedStudy.name);

      // Keep any existing unselected chapters unselected, but
      // any new chapters are selected
      const previouslyUnselectedChapters = study.chapters.filter(
        (chapter) => !selectedChapterNames.includes(chapter.name),
      );
      const newChaptersNotPreviouslyUnselected = updatedStudy.chapters.filter(
        (chapter) => !previouslyUnselectedChapters.includes(chapter),
      );
      setSelectedChapterNames(
        newChaptersNotPreviouslyUnselected.map((chapter) => chapter.name),
      );
    },
    [
      setStudies,
      setSelectedChapterNames,
      setSelectedStudyName,
      selectedChapterNames,
    ],
  );

  const onSubmit = useCallback(async () => {
    if (!selectedStudy) {
      return;
    }
    console.log("Refreshing study", selectedStudy.name);
    refreshStudy(selectedStudy).then(() => {
      console.log("Finished refreshing study", selectedStudy.name);
    });
  }, [refreshStudy, selectedStudy]);

  if (!selectedStudy) {
    return null;
  }

  return (
    <div className="flex space-x-4">
      <button
        className="p-2 rounded bg-blue-500 hover:bg-blue-700 text-white whitespace-nowrap"
        onClick={onSubmit}
      >
        Refresh Study
      </button>
    </div>
  );
};
