import { PgnTree } from "@/chess/PgnTree";
import { useState } from "react";

export type Chapter = {
  index: number;
  name: string;
  tree: PgnTree;
};

export interface Study {
  name: string;
  url: string;
  chapters: Chapter[];
}

const parseOrDefault = <T>(jsonString: string | null, d: T) => {
  if (jsonString != null) {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.log(e);
      return d;
    }
  } else {
    return d;
  }
};

// Takes a react setter and adds a post-action to take
// on the set value.
const addPostSetAction = <T>(
  setter: React.Dispatch<React.SetStateAction<T>>,
  postSetAction: (items: T) => void
): React.Dispatch<React.SetStateAction<T>> => {
  return (action: React.SetStateAction<T>) => {
    if (typeof action === "function") {
      setter((prevStudies) => {
        const updatedStudies = (action as Function)(prevStudies);
        localStorage.setItem("studies", JSON.stringify(updatedStudies));
        return updatedStudies;
      });
    } else {
      setter(action);
      postSetAction(action);
      //localStorage.setItem("studies", JSON.stringify(action));
    }
  };
};

export interface StudyData {
  studies: Study[];
  selectedStudyName?: string;
  // If null, all chapters are selected
  selectedChapterNames: string[];

  setStudies: React.Dispatch<React.SetStateAction<Study[]>>;
  setSelectedStudyName: React.Dispatch<
    React.SetStateAction<string | undefined>
  >;
  setSelectedChapterNames: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useStudyData = (): StudyData => {
  const [studies, setStudies] = useState<Study[]>(
    parseOrDefault(localStorage.getItem("studies"), [])
  );

  const setAndStoreStudies = addPostSetAction(
    setStudies,
    (studies: Study[]) => {
      localStorage.setItem("studies", JSON.stringify(studies));
    }
  );

  /*
  const setAndStoreStudies: React.Dispatch<React.SetStateAction<Study[]>> = (
    newStudies: React.SetStateAction<Study[]>
  ) => {
    if (typeof newStudies === "function") {
      setStudies((prevStudies) => {
        const updatedStudies = (newStudies as Function)(prevStudies);
        localStorage.setItem("studies", JSON.stringify(updatedStudies));
        return updatedStudies;
      });
    } else {
      setStudies(newStudies);
      localStorage.setItem("studies", JSON.stringify(newStudies));
    }
  };
  */

  //  const [studies, setStudies] = useState<Study[]>([]);
  const [selectedStudyName, setSelectedStudyName] = useState<
    string | undefined
  >(parseOrDefault(localStorage.getItem("selected-study"), undefined));

  const setAndStoreSelectedStudyName = addPostSetAction(
    setSelectedStudyName,
    (selectedStudyName: string | undefined) => {
      localStorage.setItem("selected-study", JSON.stringify(selectedStudyName));
    }
  );

  const [selectedChapterNames, setSelectedChapterNames] = useState<string[]>(
    []
  );

  return {
    studies,
    selectedStudyName,
    selectedChapterNames,
    setStudies: setAndStoreStudies,
    setSelectedStudyName: setAndStoreSelectedStudyName,
    setSelectedChapterNames,
  };
};
