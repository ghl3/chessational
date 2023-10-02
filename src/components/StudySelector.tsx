import React, { useState } from "react";
import CheckboxDropdown from "./CheckboxDropdown"; // Import the CheckboxDropdown component

interface Option {
  value: string;
  label: string;
}

///

interface StudyFetcherProps extends React.HTMLAttributes<HTMLDivElement> {
  //selectedStudy?: string;
  onStudyChange?: (study: string) => void;
  onStudySubmit?: () => void;
}

export const StudyFetcher: React.FC<StudyFetcherProps> = ({
  //selectedStudy,
  onStudyChange,
  onStudySubmit,
}) => {
  const handleStudyUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStudyChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onStudySubmit?.();
    }
  };

  return (
    <div className="flex space-x-4">
      <input
        className="bg-gray-800 text-white p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        type="text"
        placeholder="Enter Lichess Study URL"
        value={"Enter Lichess URL"}
        onChange={handleStudyUrlChange}
        onKeyDown={handleKeyDown}
      />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded"
        onClick={onStudySubmit}
      >
        Add Study
      </button>
    </div>
  );
};

///

interface StudyProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedStudy?: string;
  onStudyChange?: (study: string) => void;
  onStudySubmit?: () => void;
}

export const StudySelector: React.FC<StudyProps> = ({
  selectedStudy,
  onStudyChange,
  onStudySubmit,
}) => {
  // Existing studies, you might populate this from API or local storage
  const [existingStudies, setExistingStudies] = useState<Option[]>([
    { value: "study1", label: "Study 1" },
    { value: "study2", label: "Study 2" },
    // ... more studies
  ]);

  // Selected studies from CheckboxDropdown
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);

  const handleStudyUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStudyChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onStudySubmit?.();
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <StudyFetcher />
      <CheckboxDropdown
        text={"Select Active Studies"}
        options={existingStudies}
        selectedOptions={selectedStudies}
        setSelectedOptions={setSelectedStudies}
      />
    </div>
  );
};
