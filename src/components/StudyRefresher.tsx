"use client";

import { Study } from "@/chess/Study";
import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import { fetchStudy } from "@/utils/StudyFetcher";
import { useCallback } from "react";

interface StudyRefresherProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedStudy: Study | undefined;
  removeStudy: (studyName: string) => void;
  addStudyAndChapters: (study: StudyChapterAndLines) => void;
}

export const StudyRefresher: React.FC<StudyRefresherProps> = ({
  selectedStudy,
  removeStudy,
  addStudyAndChapters,
}) => {
  const refreshStudy = useCallback(
    async (selectedStudy: Study) => {
      // Delete the study
      removeStudy(selectedStudy.name);

      const study: StudyChapterAndLines = await fetchStudy(selectedStudy.url);
      if (study.chapters.length === 0) {
        throw new Error("Study has no chapters");
      }
      addStudyAndChapters(study);
    },
    [removeStudy, addStudyAndChapters],
  );

  const onSubmit = useCallback(async () => {
    if (!selectedStudy) {
      return;
    }
    refreshStudy(selectedStudy);
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
