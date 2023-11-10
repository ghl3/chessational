import { Study } from "@/chess/Study";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const localStorageGet = (key: string): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key);
  }
  return null;
};

const localStorageSet = (key: string, value: string) => {
  if (typeof window !== "undefined") {
    return localStorage.setItem(key, value);
  }
};

const localStorageRemove = (key: string) => {
  if (typeof window !== "undefined") {
    return localStorage.removeItem(key);
  }
};

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
  const [studies, setStudies] = useState<Study[]>([]);

  const setAndStoreStudies = useMemo(
    () =>
      addPostSetAction(setStudies, (studies: Study[]) => {
        localStorageSet("studies", JSON.stringify(studies));
      }),
    [setStudies]
  );

  const [selectedStudyName, setSelectedStudyName] = useState<
    string | undefined
  >(undefined);

  const setAndStoreSelectedStudyName = useMemo(
    () =>
      addPostSetAction(
        setSelectedStudyName,
        (selectedStudyName: string | undefined) => {
          if (selectedStudyName == null) {
            localStorageRemove("selected-study");
          } else {
            localStorageSet(
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

  const setAndStoreSelectedChapterNames = useMemo(
    () =>
      addPostSetAction(
        setSelectedChapterNames,
        (selectedChapterNames: string[]) => {
          localStorageSet(
            "selected-chapters",
            JSON.stringify(selectedChapterNames)
          );
        }
      ),
    []
  );

  const isPopulated = useRef(false);

  const populateCachedValues = useCallback(() => {
    if (!isPopulated.current) {
      setAndStoreStudies(parseOrDefault(localStorageGet("studies"), []));
      setAndStoreSelectedStudyName(
        parseOrDefault(localStorageGet("selected-study"), undefined)
      );
      setAndStoreSelectedChapterNames(
        parseOrDefault(localStorageGet("selected-chapters"), [])
      );
      isPopulated.current = true;
    }
  }, [
    setAndStoreStudies,
    setAndStoreSelectedStudyName,
    setAndStoreSelectedChapterNames,
  ]);

  useEffect(() => {
    populateCachedValues();
  }, [populateCachedValues]);

  return {
    studies,
    selectedStudyName,
    selectedChapterNames,
    setStudies: setAndStoreStudies,
    setSelectedStudyName: setAndStoreSelectedStudyName,
    setSelectedChapterNames: setAndStoreSelectedChapterNames,
  };
};
