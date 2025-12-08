"use client";

import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import { useCallback, useState } from "react";
import { Button } from "./Button";

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
        // Re-throw the error so the promise chain properly rejects
        throw error;
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
        fetchStudyData(studyUrl)
          .then(() => onClose())
          .catch(() => {
            // Error already handled in fetchStudyData
          });
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
      .catch(() => {
        // Error already handled in fetchStudyData
      });
  }, [studyUrl, fetchStudyData, onClose, onFetchError]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Add New Study</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-2xl transition-colors focus:outline-hidden"
          aria-label="Close dialog"
        >
          ×
        </button>
      </div>
      <div className="flex flex-col gap-4">
        <input
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          type="text"
          placeholder="Enter Lichess Study URL"
          value={studyUrl}
          onChange={handleStudyUrlChange}
          onKeyDown={handleKeyDown}
          aria-label="Lichess Study URL input"
        />
        <Button
          label="Add Study"
          variant="primary"
          size="medium"
          fullWidth
          onClick={onStudySubmit}
          disabled={!studyUrl || studyUrl.trim() === ""}
        />
      </div>
    </div>
  );
};

export default StudyAdder;
