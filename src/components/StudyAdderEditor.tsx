"use client";

import { Study } from "@/chess/Study";

import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import { useEffect, useState } from "react";
import Modal from "react-modal";
import { StudyAdder } from "./StudyAdder";
import StudyCardList from "./StudyCardList";

interface StudyAdderEditorProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedStudy: Study | null;
  studies: Study[];
  deleteStudy: (studyName: string) => void;
  selectStudy: (studyName: string) => void;
  addStudyAndChapters: (study: StudyChapterAndLines) => void;
}

export const StudyAdderEditor: React.FC<StudyAdderEditorProps> = ({
  studies,
  selectedStudy,
  selectStudy,
  addStudyAndChapters,
  deleteStudy,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [studyToDelete, setStudyToDelete] = useState<string | null>(null);
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

  const title = selectedStudy == null ? "Add Study" : selectedStudy.name;

  return (
    <div className="flex space-x-4">
      <button
        className="p-2 rounded bg-blue-500 hover:bg-blue-700 text-white whitespace-nowrap"
        onClick={openModal}
      >
        {title}
      </button>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Add Study Modal"
        className="modal bg-gray-800 mx-auto rounded-lg p-6 max-w-xl w-full"
        overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
      >
        <div className="flex flex-col items-center  space-y-4">
          <StudyCardList
            studies={studies}
            selectedStudy={selectedStudy}
            selectStudy={selectStudy}
            addStudyAndChapters={addStudyAndChapters}
            deleteStudy={deleteStudy}
          />
          <StudyAdder addStudyAndChapters={addStudyAndChapters} />
        </div>
      </Modal>
    </div>
  );
};
