"use client";

import { Study } from "@/chess/Study";
import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import { fetchStudy } from "@/utils/StudyFetcher";
import React, { useCallback, useEffect, useState } from "react";
import Modal from "react-modal";
import DeleteConfirmation from "./DeleteConfirmation";
import StudyCardList from "./StudyCardList";
import StudyInput from "./StudyInput";

interface StudyAdderEditorProps {
  selectedStudy: Study | null;
  studies: Study[];
  deleteStudy: (studyName: string) => void;
  selectStudy: (studyName: string) => void;
  addStudyAndChapters: (study: StudyChapterAndLines) => void;
}

const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
    <span className="text-white">Loading...</span>
  </div>
);

const AddStudyButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      className="w-full p-2 text-white rounded bg-blue-500 hover:bg-blue-700"
      onClick={onClick}
    >
      Add Study
    </button>
  );
};

export const StudyAdderEditor: React.FC<StudyAdderEditorProps> = ({
  studies,
  selectedStudy,
  selectStudy,
  addStudyAndChapters,
  deleteStudy,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStudyInput, setIsStudyInput] = useState(false);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [studyToDelete, setStudyToDelete] = useState<string | null>(null);

  useEffect(() => {
    Modal.setAppElement("#root");
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const title = selectedStudy ? selectedStudy.name : "Add Study";

  const fetchAndSetLoading = useCallback(
    async (studyId: string): Promise<StudyChapterAndLines> => {
      setIsLoading(true);
      const studyChapterAndLines = await fetchStudy(studyId);
      setIsLoading(false);
      return studyChapterAndLines;
    },
    [],
  );

  const showDeleteConfirmation = useCallback((studyName: string) => {
    setIsDeleteConfirmation(true);
    setStudyToDelete(studyName);
  }, []);

  const selectStudyAndCloseModal = (studyName: string) => {
    selectStudy(studyName);
    setIsModalOpen(false);
  };

  const getModalContent = () => {
    if (isLoading) {
      return <LoadingScreen />;
    } else if (isDeleteConfirmation) {
      return (
        <DeleteConfirmation
          onConfirmDeleteYes={() => {
            if (studyToDelete === null) {
              throw new Error("selectedStudy is null");
            }
            deleteStudy(studyToDelete);
            setIsDeleteConfirmation(false);
            setIsModalOpen(false);
          }}
          onConfirmDeleteNo={() => {
            setIsDeleteConfirmation(false);
          }}
        />
      );
    } else if (isStudyInput || studies.length === 0) {
      return (
        <StudyInput
          fetchStudy={fetchAndSetLoading}
          addStudyAndChapters={addStudyAndChapters}
          onClose={() => {
            setIsStudyInput(false);
            setIsModalOpen(false);
          }}
          onFetchError={() => {
            setIsStudyInput(false);
            setIsLoading(false);
          }}
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center space-y-4">
          <StudyCardList
            studies={studies}
            selectedStudy={selectedStudy}
            selectStudy={selectStudyAndCloseModal}
            fetchStudy={fetchAndSetLoading}
            addStudyAndChapters={addStudyAndChapters}
            deleteStudy={showDeleteConfirmation}
          />
          <AddStudyButton onClick={() => setIsStudyInput(true)} />
        </div>
      );
    }
  };

  return (
    <div>
      <button
        className="p-2 rounded bg-blue-500 hover:bg-blue-700 text-white whitespace-nowrap"
        onClick={openModal}
      >
        {title}
      </button>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Study Modal"
        className="modal bg-gray-800 mx-auto rounded-lg p-6 max-w-xl w-full"
        overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
      >
        {getModalContent()}
      </Modal>
    </div>
  );
};
