"use client";

import { Study } from "@/chess/Study";
import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import { useCallback } from "react";

interface StudyRefreshButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  study: Study;
  deleteStudy: (studyName: string) => void;
  fetchStudy: (studyId: string) => Promise<StudyChapterAndLines>;
  addStudyAndChapters: (study: StudyChapterAndLines) => void;
}

export const StudyRefreshButton: React.FC<StudyRefreshButtonProps> = ({
  study,
  deleteStudy,
  fetchStudy,
  addStudyAndChapters,
}) => {
  const onSubmit = useCallback(async () => {
    deleteStudy(study.name);
    const updatedStudy: StudyChapterAndLines = await fetchStudy(study.url);
    if (updatedStudy.chapters.length === 0) {
      throw new Error("Study has no chapters");
    }
    addStudyAndChapters(updatedStudy);
  }, [addStudyAndChapters, deleteStudy, fetchStudy, study.name, study.url]);

  return (
    <button
      className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-300"
      onClick={onSubmit}
    >
      Refresh Study
    </button>
  );
};
