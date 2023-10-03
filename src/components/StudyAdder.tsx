import { PgnTree } from "@/chess/PgnTree";
import { Chapter, Study } from "@/hooks/UseStudyData";
import { useCallback, useState } from "react";

const getStudy = async (studyId: string): Promise<PgnTree[]> => {
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

  const { pgns } = await res.json();

  return pgns;
};

const getChapters = (pgnTrees: PgnTree[]): Chapter[] => {
  const chapters: Chapter[] = [];

  for (let i = 0; i < pgnTrees.length; i++) {
    const pgnTree = pgnTrees[i];
    const chapter: Chapter = {
      index: i,
      name: pgnTree.chapter || "Unknown Chapter",
      tree: pgnTree,
    };

    chapters.push(chapter);
  }

  return chapters;
};

interface StudyAdderProps extends React.HTMLAttributes<HTMLDivElement> {
  setStudies: React.Dispatch<React.SetStateAction<Study[]>>;
  setSelectedStudyName: React.Dispatch<
    React.SetStateAction<string | undefined>
  >;
}

export const StudyAdder: React.FC<StudyAdderProps> = ({
  setStudies,
  setSelectedStudyName,
}) => {
  const [studyUrl, setStudyUrl] = useState("");

  // TODO: Don't re-add the same study
  const addStudy = (study: Study) => {
    setStudies((prevStudies) => [...prevStudies, study]);
  };

  const fetchStudyData = useCallback(
    async (studyUrl: string) => {
      try {
        const trees: PgnTree[] = await getStudy(studyUrl);
        if (trees.length === 0) {
          throw new Error("Study has no trees");
        }

        const studyName = trees[0].study;
        const chapters: Chapter[] = getChapters(trees);
        addStudy({
          url: studyUrl,
          name: studyName,
          chapters: chapters,
        });
        setSelectedStudyName(studyName);
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
    fetchStudyData(studyUrl);
  }, [studyUrl]);

  return (
    <div className="flex space-x-4">
      <input
        className="bg-gray-800 text-white p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        type="text"
        placeholder="Enter Lichess Study URL"
        value={studyUrl}
        onChange={handleStudyUrlChange}
        onKeyDown={handleKeyDown}
      />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded"
        onClick={onStudySubmit}
      >
        Add Study
      </button>
    </div>
  );
};
