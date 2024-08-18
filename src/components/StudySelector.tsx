"use client";

import { Study } from "@/chess/Study";
import React from "react";

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
