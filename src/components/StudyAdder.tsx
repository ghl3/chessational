"use client";

import { Chapter } from "@/chess/Chapter";
import { Study } from "@/chess/Study";
import { parsePgnStringToChapters } from "@/utils/PgnParser";
import { fetchStudy } from "@/utils/StudyFetcher";
import { useCallback, useEffect, useState } from "react";
import Modal from "react-modal";

interface StudyAdderProps extends React.HTMLAttributes<HTMLDivElement> {
  setStudies: React.Dispatch<React.SetStateAction<Study[]>>;
  setSelectedStudyName: React.Dispatch<
    React.SetStateAction<string | undefined>
  >;
  setSelectedChapterNames: React.Dispatch<React.SetStateAction<string[]>>;
}

const extractStudyName = (url: string) => {
  const regex = /(?:https?:\/\/(?:www\.)?lichess\.org\/study\/)?([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const StudyAdder: React.FC<StudyAdderProps> = ({
  setStudies,
  setSelectedStudyName,
  setSelectedChapterNames,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      Modal.setAppElement("#root");
    }
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [studyUrl, setStudyUrl] = useState("");

  // TODO: Don't re-add the same study
  const addStudy = useCallback(
    (study: Study) => {
      setStudies((prevStudies) => [...prevStudies, study]);
    },
    [setStudies],
  );

  const fetchStudyData = useCallback(
    async (studyUrl: string) => {
      setIsLoading(true);
      try {
        const study: Study = await fetchStudy(studyUrl);
        if (study.chapters.length === 0) {
          throw new Error("Study has no chapters");
        }

        addStudy(study);
        setSelectedStudyName(study.name);
        // Default all the chapters to selected
        setSelectedChapterNames(study.chapters.map((chapter) => chapter.name));
        setStudyUrl("");
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to get study:", error);
        setIsLoading(false);
      }
    },
    [addStudy, setSelectedChapterNames, setSelectedStudyName],
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
        fetchStudyData(studyUrl).then(closeModal);
      }
    },
    [studyUrl, fetchStudyData],
  );

  // Handle when the user presses enter
  const onStudySubmit = useCallback(() => {
    if (!studyUrl || studyUrl === "") {
      throw new Error("Study URL is empty");
    }
    const studyName = extractStudyName(studyUrl);
    if (studyName === null) {
      throw new Error("Please enter a valid Lichess study URL");
    }
    fetchStudyData(studyName).then(closeModal);
  }, [studyUrl, fetchStudyData]);

  return (
    <div className="flex space-x-4">
      <button
        className="p-2 rounded bg-blue-500 hover:bg-blue-700 text-white whitespace-nowrap"
        onClick={openModal}
      >
        Add New Study
      </button>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Add Study Modal"
        className="modal"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        {isLoading ? (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full flex items-center justify-center">
            <span className="text-white">Loading...</span>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg text-white">Add New Study</h2>
              <button
                onClick={closeModal}
                className="text-white text-2xl focus:outline-none"
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
        )}
      </Modal>
    </div>
  );
};
