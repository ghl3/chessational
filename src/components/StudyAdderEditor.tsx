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

const extractStudyName = (url: string) => {
  const regex = /(?:https?:\/\/(?:www\.)?lichess\.org\/study\/)?([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
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

  const [studyUrl, setStudyUrl] = useState("");
  /*
  // TODO: Don't re-add the same study
  const addStudy = useCallback(
    (study: Study) => {
      setStudies((prevStudies) => [...prevStudies, study]);
    },
    [setStudies],
  );
  */

  /*
  const fetchStudyData = useCallback(
    async (studyUrl: string) => {
      setIsLoading(true);
      try {
        const study: StudyChapterAndLines = await fetchStudy(studyUrl);
        if (study.chapters.length === 0) {
          throw new Error("Study has no chapters");
        }

        addStudyAndChapters(study);
        //selectStudy(study.study.name);
        // Default all the chapters to selected
        //setSelectedChapterNames(study.chapters.map((chapter) => chapter.name));
        setStudyUrl("");
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to get study:", error);
        setIsLoading(false);
      }
    },
    [addStudyAndChapters],
  );
  */

  /*

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

  const title = selectedStudy == null ? "Add Study" : "Add/Edit Study";

  const handleDelete = useCallback((studyName: string) => {
    setStudyToDelete(studyName);
    setShowDialog(true);
  }, []);

  const onConfirmDeleteYes = useCallback(() => {
    if (studyToDelete == null) {
      throw new Error("selectedStudy is null");
    }
    // Perform delete action here
    deleteStudy(studyToDelete);
    setShowDialog(false);
    setIsOpen(false);
    setStudyToDelete(null);
  }, [studyToDelete, onStudyDelete]);

  const onConfirmDeleteNo = useCallback(() => {
    setShowDialog(false);
    setIsOpen(false);
    setStudyToDelete(null);
  }, []);

  */

  return (
    <div className="flex space-x-4">
      <button
        className="p-2 rounded bg-blue-500 hover:bg-blue-700 text-white whitespace-nowrap"
        onClick={openModal}
      >
        {"Foobar"}
      </button>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Add Study Modal"
        className="modal"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <div>
          <StudyAdder addStudyAndChapters={addStudyAndChapters} />
          <StudyCardList
            studies={studies}
            selectedStudy={selectedStudy}
            addStudyAndChapters={addStudyAndChapters}
            deleteStudy={deleteStudy}
          />
        </div>
      </Modal>
    </div>
  );
};
