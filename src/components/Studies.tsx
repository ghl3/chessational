"use client";

import { Study } from "@/chess/Study";
import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import { StudyData } from "@/hooks/UseStudyData";
import { fetchStudy } from "@/utils/StudyFetcher";
import { invalidateGameComparisonCache } from "@/app/db";
import React, { useCallback, useState } from "react";
import { Button } from "./Button";
import DeleteConfirmation from "./DeleteConfirmation";
import StudyCardList from "./StudyCardList";
import StudyInput from "./StudyInput";

interface StudiesProps {
  studyData: StudyData;
}

const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="bg-gray-700 rounded-lg p-6 text-center">
      <span className="text-white">Loading...</span>
    </div>
  </div>
);

export const Studies: React.FC<StudiesProps> = ({ studyData }) => {
  const {
    studies,
    selectedStudy,
    selectStudy,
    addStudyAndChapters: originalAddStudyAndChapters,
    deleteStudy,
  } = studyData;

  const [isLoading, setIsLoading] = useState(false);

  // Wrap addStudyAndChapters to invalidate game comparison cache
  const addStudyAndChapters = useCallback(
    async (studyAndChapters: StudyChapterAndLines) => {
      originalAddStudyAndChapters(studyAndChapters);
      await invalidateGameComparisonCache();
    },
    [originalAddStudyAndChapters]
  );
  const [isStudyInput, setIsStudyInput] = useState(false);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [studyToDelete, setStudyToDelete] = useState<string | null>(null);

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
      // Invalidate game comparison cache since repertoire changed
      await invalidateGameComparisonCache();
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
          onConfirmDeleteYes={async () => {
            if (studyToDelete === null) {
              throw new Error("selectedStudy is null");
            }
            deleteStudy(studyToDelete);
            // Invalidate game comparison cache since repertoire changed
            await invalidateGameComparisonCache();
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
        <div className="flex flex-col items-center gap-4">
          <StudyCardList
            studies={studies}
            selectedStudy={selectedStudy || null}
            selectStudy={selectStudyAndCloseModal}
            deleteStudy={showDeleteConfirmation}
            refreshStudy={refreshStudy}
          />
          <Button
            label="Add Study"
            variant="primary"
            size="medium"
            onClick={() => setIsStudyInput(true)}
          />
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
