"use client";

import { Study } from "@/chess/Study";
import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import { StudyData } from "@/hooks/UseStudyData";
import { fetchStudy } from "@/utils/StudyFetcher";
import React, { useCallback, useState } from "react";
import DeleteConfirmation from "./DeleteConfirmation";
import StudyCardList from "./StudyCardList";
import StudyInput from "./StudyInput";

interface StudiesProps {
  studyData: StudyData;
}

const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
    <span className="text-white">Loading...</span>
  </div>
);

const AddStudyButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      className="w-1/4 p-2 text-white rounded bg-blue-500 hover:bg-blue-700"
      onClick={onClick}
    >
      Add Study
    </button>
  );
};

export const Studies: React.FC<StudiesProps> = ({ studyData }) => {
  const {
    studies,
    selectedStudy,
    selectStudy,
    addStudyAndChapters,
    deleteStudy,
  } = studyData;

  const [isLoading, setIsLoading] = useState(false);
  const [isStudyInput, setIsStudyInput] = useState(false);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [studyToDelete, setStudyToDelete] = useState<string | null>(null);

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

  const refreshStudy = useCallback(
    async (study: Study): Promise<StudyChapterAndLines> => {
      setIsLoading(true);
      deleteStudy(study.name);
      const updatedStudy: StudyChapterAndLines = await fetchStudy(study.url);
      if (updatedStudy.chapters.length === 0) {
        throw new Error("Study has no chapters");
      }
      addStudyAndChapters(updatedStudy);
      setIsLoading(false);
      return updatedStudy;
    },
    [addStudyAndChapters, deleteStudy, setIsLoading],
  );

  const showDeleteConfirmation = useCallback((studyName: string) => {
    setIsDeleteConfirmation(true);
    setStudyToDelete(studyName);
  }, []);

  const selectStudyAndCloseModal = useCallback(
    (studyName: string) => {
      selectStudy(studyName);
    },
    [selectStudy],
  );

  const getModalContent = useCallback(() => {
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
          }}
          onFetchError={() => {
            setIsStudyInput(false);
            setIsLoading(false);
          }}
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center space-y-4 p-2">
          <StudyCardList
            studies={studies}
            selectedStudy={selectedStudy || null}
            selectStudy={selectStudyAndCloseModal}
            deleteStudy={showDeleteConfirmation}
            refreshStudy={refreshStudy}
          />
          <AddStudyButton onClick={() => setIsStudyInput(true)} />
        </div>
      );
    }
  }, [
    isLoading,
    isDeleteConfirmation,
    isStudyInput,
    studies,
    studyToDelete,
    deleteStudy,
    fetchAndSetLoading,
    addStudyAndChapters,
    selectedStudy,
    selectStudyAndCloseModal,
    showDeleteConfirmation,
    refreshStudy,
  ]);

  return <div>{getModalContent()}</div>;
};
