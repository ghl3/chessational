import { Chapter } from "@/chess/Chapter";
import { Study } from "@/chess/Study";
import { parsePgnStringToChapters } from "@/utils/PgnParser";
import { useCallback, useState } from "react";

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

  if (res.status !== 200) {
    console.log("Error");
    throw new Error("Error");
  }

  const { pgnText } = await res.json();

  const chapters: Chapter[] = parsePgnStringToChapters(pgnText);

  if (chapters.length === 0) {
    throw new Error("Study has no chapters");
  }

  const studyName = chapters[0].name;

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
  const addStudy = useCallback(
    (study: Study) => {
      setStudies((prevStudies) => [...prevStudies, study]);
    },
    [setStudies]
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
    [addStudy, setSelectedChapterNames, setSelectedStudyName]
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
    [studyUrl, fetchStudyData]
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
      <input
        className="bg-gray-700 text-white p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        type="text"
        placeholder="Enter Lichess Study URL"
        value={studyUrl}
        onChange={handleStudyUrlChange}
        onKeyDown={handleKeyDown}
      />

      <button
        className="p-2 rounded bg-blue-500 hover:bg-blue-700 text-white"
        style={{ visibility: studyUrl ? "visible" : "hidden" }}
        onClick={onStudySubmit}
        disabled={!studyUrl || studyUrl === ""}
      >
        Add Study
      </button>
    </div>
  );
};
