import React, { useEffect, useRef, useState } from "react";
import Modal from "react-modal";

import { Study } from "@/hooks/UseStudyData";

interface StudySelectorProps {
  studies: Study[];
  selectedStudy?: string;
  onStudyChange?: (study: string) => void;
  onDelete?: (study: string) => void;
}

const modalStyle = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "400px",
    height: "200px",
  },
};

export const StudySelector2: React.FC<StudySelectorProps> = ({
  studies,
  selectedStudy,
  onStudyChange,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleClickInButton = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.stopPropagation();
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
    <div className="relative w-full" ref={containerRef}>
      <div
        className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none cursor-pointer  flex justify-between items-center"
        onClick={handleClickInButton}
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
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded p-4">
            <h2 className="text-lg font-bold mb-4 text-black">
              Confirm Delete
            </h2>

            <button
              className="bg-blue-500 text-white rounded px-4 py-2 mr-2"
              onClick={confirmDelete}
            >
              Yes
            </button>
            <button
              className="bg-gray-300 text-black rounded px-4 py-2"
              onClick={() => setShowDialog(false)}
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
