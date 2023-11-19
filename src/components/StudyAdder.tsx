import { Chapter } from "@/chess/Chapter";
import { Study } from "@/chess/Study";
import { parsePgnStringToChapters } from "@/utils/PgnParser";
import { useCallback, useState } from "react";
import Modal from "react-modal";

const getStudy = async (studyId: string): Promise<Study> => {
  const endpoint = "/api/getStudy";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = new URL(endpoint, apiUrl).href;

  const res = await fetch(url, {
    method: "POST",
    cache: "force-cache",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ studyId: studyId }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  const { pgnText } = await res.json();

  const chapters: Chapter[] = parsePgnStringToChapters(pgnText);

  if (chapters.length === 0) {
    throw new Error("Study has no chapters");
  }

  const studyName = chapters[0].studyName;

  return {
    name: studyName,
    url: studyId,
    chapters: chapters,
  };
};

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
      try {
        const study: Study = await getStudy(studyUrl);
        if (study.chapters.length === 0) {
          throw new Error("Study has no chapters");
        }

        addStudy(study);
        setSelectedStudyName(study.name);
        // Default all the chapters to selected
        setSelectedChapterNames(study.chapters.map((chapter) => chapter.name));
        setStudyUrl("");
      } catch (error) {
        console.error("Failed to get study:", error);
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
        fetchStudyData(studyUrl);
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
    fetchStudyData(studyName);
  }, [studyUrl, fetchStudyData]);

  return (
    <div className="flex space-x-4">
      <button
        className="p-2 rounded bg-blue-500 hover:bg-blue-700 text-white"
        onClick={openModal}
      >
        Add New Study
      </button>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Add Study Modal"
        appElement={document.getElementById("root") as HTMLElement}
        className="modal"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
          {" "}
          {/* Opaque background for modal content */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg text-white">Add New Study</h2>
            <button
              onClick={closeModal}
              className="text-white text-2xl focus:outline-none"
            >
              ×
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
              closeModal();
            }}
            disabled={!studyUrl || studyUrl === ""}
          >
            Add Study
          </button>
        </div>
      </Modal>
    </div>
  );
};
