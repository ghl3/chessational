import { Study } from "@/chess/Study";
import { useMemo, useState } from "react";

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
    // An 'action' is either a function that takes a T
    // or a value of type T.
    if (typeof action === "function") {
      setter((previousValue) => {
        const updatedValue = (action as Function)(previousValue);
        postSetAction(updatedValue);
        return updatedValue;
      });
    } else {
      setter(action);
      postSetAction(action);
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

  const setAndStoreStudies = useMemo(
    () =>
      addPostSetAction(setStudies, (studies: Study[]) => {
        localStorage.setItem("studies", JSON.stringify(studies));
      }),
    [setStudies]
  );

  const [selectedStudyName, setSelectedStudyName] = useState<
    string | undefined
  >(parseOrDefault(localStorage.getItem("selected-study"), undefined));

  const setAndStoreSelectedStudyName = useMemo(
    () =>
      addPostSetAction(
        setSelectedStudyName,
        (selectedStudyName: string | undefined) => {
          if (selectedStudyName == null) {
            localStorage.removeItem("selected-study");
          } else {
            localStorage.setItem(
              "selected-study",
              JSON.stringify(selectedStudyName)
            );
          }
        }
      ),
    [setSelectedStudyName]
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
