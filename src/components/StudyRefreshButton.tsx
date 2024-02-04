"use client";

import { Study } from "@/chess/Study";
import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import { fetchStudy } from "@/utils/StudyFetcher";
import { useCallback } from "react";

interface StudyRefreshButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  study: Study;
  deleteStudy: (studyName: string) => void;
  addStudyAndChapters: (study: StudyChapterAndLines) => void;
}

export const StudyRefreshButton: React.FC<StudyRefreshButtonProps> = ({
  study,
  deleteStudy,
  addStudyAndChapters,
}) => {
  const refreshStudy = useCallback(
    async (study: Study) => {
      deleteStudy(study.name);
      const updatedStudy: StudyChapterAndLines = await fetchStudy(study.url);
      if (updatedStudy.chapters.length === 0) {
        throw new Error("Study has no chapters");
      }
      addStudyAndChapters(updatedStudy);
    },
    [deleteStudy, addStudyAndChapters],
  );

  const onSubmit = useCallback(async () => {
    refreshStudy(study);
  }, [refreshStudy, study]);

  return (
    <button
      className="p-2 rounded bg-blue-500 hover:bg-blue-700 text-white whitespace-nowrap"
      onClick={onSubmit}
    >
      Refresh Study
    </button>
  );
};
