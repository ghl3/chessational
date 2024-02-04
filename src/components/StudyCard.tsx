import { Study } from "@/chess/Study";
import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import React from "react";
import { StudyRefreshButton } from "./StudyRefreshButton";

interface StudyCardProps {
  study: Study;
  deleteStudy: (studyName: string) => void;
  addStudyAndChapters: (study: StudyChapterAndLines) => void;
}

const StudyCard: React.FC<StudyCardProps> = ({
  study,
  addStudyAndChapters,
  deleteStudy,
}) => {
  return (
    <div className="max-w-md bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <h2 className="text-xl font-bold tracking-tight text-white flex-grow mr-4">
          {study.name}
        </h2>
        <div className="flex gap-2">
          <div className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-300">
            <StudyRefreshButton
              study={study}
              deleteStudy={deleteStudy}
              addStudyAndChapters={addStudyAndChapters}
            />
          </div>
          <button
            onClick={() => deleteStudy(study.name)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyCard;
