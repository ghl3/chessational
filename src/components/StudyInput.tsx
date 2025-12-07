"use client";

import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import { useCallback, useState } from "react";

interface StudyAdderProps extends React.HTMLAttributes<HTMLDivElement> {
  fetchStudy: (studyId: string) => Promise<StudyChapterAndLines>;
  onClose: () => void;
  onFetchError: (error: unknown) => void;
  addStudyAndChapters: (study: StudyChapterAndLines) => void;
}

const extractStudyName = (url: string) => {
  const regex = /(?:https?:\/\/(?:www\.)?lichess\.org\/study\/)?([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const StudyAdder: React.FC<StudyAdderProps> = ({
  fetchStudy,
  onClose,
  onFetchError,
  addStudyAndChapters,
}) => {
  const [studyUrl, setStudyUrl] = useState("");

  const fetchStudyData = useCallback(
    async (studyUrl: string) => {
      try {
        const study: StudyChapterAndLines = await fetchStudy(studyUrl);
        if (study.chapters.length === 0) {
          throw new Error("Study has no chapters");
        }

        addStudyAndChapters(study);
        setStudyUrl("");
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Failed to fetch study:", errorMessage, error);
        onFetchError(error);
      }
    },
    [addStudyAndChapters, fetchStudy, onFetchError],
  );

  // Handle when the user is typing a new URL
  const handleStudyUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setStudyUrl(e.target.value);
    },
    [],
  );

  // Handle when the user presses enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        fetchStudyData(studyUrl).then(onClose);
      }
    },
    [fetchStudyData, studyUrl, onClose],
  );

  // Handle when the user presses enter
  const onStudySubmit = useCallback(() => {
    if (!studyUrl || studyUrl.trim() === "") {
      onFetchError(new Error("Study URL cannot be empty"));
      return;
    }
    const studyName = extractStudyName(studyUrl);
    if (studyName === null) {
      onFetchError(
        new Error(
          "Invalid URL format. Please enter a valid Lichess study URL (e.g., https://lichess.org/study/ABC123)",
        ),
      );
      return;
    }
    fetchStudyData(studyName)
      .then(() => onClose())
      .catch((error) => {
        // Error already handled in fetchStudyData
        onFetchError(error);
      });
  }, [studyUrl, fetchStudyData, onClose, onFetchError]);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg text-white">Add New Study</h2>
        <button
          onClick={onClose}
          className="text-white text-2xl focus:outline-none"
          aria-label="Close dialog"
        >
          &#xd7;
        </button>
      </div>
      <input
        className="w-full p-2 mb-4 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        type="text"
        placeholder="Enter Lichess Study URL"
        value={studyUrl}
        onChange={handleStudyUrlChange}
        onKeyDown={handleKeyDown}
        aria-label="Lichess Study URL input"
      />
      <button
        className={`w-full p-2 text-white rounded ${
          studyUrl
            ? "bg-blue-500 hover:bg-blue-700"
            : "bg-gray-500 cursor-not-allowed"
        }`}
        onClick={() => {
          onStudySubmit();
        }}
        disabled={!studyUrl || studyUrl === ""}
      >
        Add Study
      </button>
    </div>
  );
};

export default StudyAdder;
