import { Study } from "@/chess/Study";
import { useCallback, useState } from "react";

const getStudy = async (studyId: string): Promise<Study> => {
  const res = await fetch("http://localhost:3000/api/getStudy", {
    method: "POST",
    cache: "force-cache",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ studyId: studyId }),
  });

  if (res.status !== 200) {
    console.log("Error");
    throw new Error("Error");
  }

  const { studyName, chapters } = await res.json();

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
  const [studyUrl, setStudyUrl] = useState("");

  // TODO: Don't re-add the same study
  const addStudy = (study: Study) => {
    setStudies((prevStudies) => [...prevStudies, study]);
  };

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
    [setStudies, setSelectedStudyName]
  );

  // Handle when the user is typing a new URL
  const handleStudyUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setStudyUrl(e.target.value);
    },
    []
  );

  // Handle when the user presses enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        fetchStudyData(studyUrl);
      }
    },
    [studyUrl]
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
  }, [studyUrl]);

  return (
    <div className="flex space-x-4">
      <input
        className="bg-gray-700 text-white p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        type="text"
        placeholder="Enter Lichess Study URL"
        value={studyUrl}
        onChange={handleStudyUrlChange}
        onKeyDown={handleKeyDown}
      />

      <button
        className={`p-2 rounded ${
          studyUrl
            ? "bg-blue-500 hover:bg-blue-700 text-white"
            : "bg-gray-500 text-gray-300 opacity-70 cursor-not-allowed"
        }`}
        onClick={onStudySubmit}
        disabled={!studyUrl || studyUrl === ""}
      >
        Add Study
      </button>
    </div>
  );
};
