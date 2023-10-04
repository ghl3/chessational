import React, { useState } from "react";

import { Study } from "@/hooks/UseStudyData";

interface StudySelectorProps {
  studies: Study[];
  selectedStudy?: string;
  onStudyChange?: (study: string) => void;
  onDelete?: (study: string) => void;
}

export const StudySelector2: React.FC<StudySelectorProps> = ({
  studies,
  selectedStudy,
  onStudyChange,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleDropdownChange = (studyName: string) => {
    onStudyChange?.(studyName);
    setIsOpen(false);
  };

  const handleDelete = (studyName: string) => {
    setShowDialog(true);
    // You might want to set which study to delete here
  };

  const confirmDelete = () => {
    if (selectedStudy == null) {
      throw new Error("selectedStudy is null");
    }
    // Perform delete action here
    onDelete?.(selectedStudy);
    setShowDialog(false);
  };

  return (
    <div className="relative w-full">
      <div
        className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none cursor-pointer  flex justify-between items-center"
        onClick={toggleDropdown}
      >
        <span>{selectedStudy || "Select a study"}</span>
        <svg
          className="h-5 w-5 pointer-events-none"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-full z-10 bg-gray-800 text-white border border-gray-700 rounded">
          <ul>
            {studies.map((study) => (
              <li
                className="flex justify-between p-2 border-t border-gray-700 hover:bg-gray-700"
                key={study.name}
              >
                <div onClick={() => handleDropdownChange(study.name)}>
                  {study.name}
                </div>
                <button
                  className="text-red-500 hover:bg-red-700 hover:text-white p-1 rounded"
                  onClick={() => handleDelete(study.name)}
                >
                  x
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {showDialog && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-4 rounded">
            <p>Are you sure you want to delete this study?</p>
            <button className="mr-2" onClick={confirmDelete}>
              Yes
            </button>
            <button onClick={() => setShowDialog(false)}>No</button>
          </div>
        </div>
      )}
    </div>
  );
};
