import { db } from "@/app/db";
import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { Study } from "@/chess/Study";
import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";

export interface StudyData {
  studies: Study[];
  selectedStudyName?: string;
  selectedStudy?: Study;
  chapters?: Chapter[];
  selectedChapterNames?: string[];
  lines?: Line[];

  addStudyAndChapters: (studyAndChapters: StudyChapterAndLines) => void;
  removeStudy: (studyName: string) => void;
  selectStudy: (studyName: string) => void;
  addSelectedChapterName: (chapterName: string) => void;
  removeSelectedChapterName: (chapterName: string) => void;
}

export const useStudyData = (): StudyData => {
  const studies: Study[] = useLiveQuery(
    async () => {
      const studies = await db.studies.toArray();
      return studies || [];
    },
    [],
    [],
  );

  const selectedStudyName: string | undefined = useLiveQuery(async () => {
    const selectedStudyNames = await db.selectedStudyName.toArray();
    if (selectedStudyNames.length === 0) {
      return undefined;
    } else {
      return selectedStudyNames[0].studyName;
    }
  }, []);

  const selectedStudy: Study | undefined = useLiveQuery(async () => {
    if (selectedStudyName == undefined) {
      return undefined;
    }
    const study = await db.studies
      .where("name")
      .equalsIgnoreCase(selectedStudyName)
      .first();
    return study;
  }, [selectedStudyName]);

  // All chapters from the currently selected study
  const chapters: Chapter[] | undefined = useLiveQuery(async () => {
    if (selectedStudyName == null) {
      return [];
    }
    const chatpers = await db.chapters
      .where("studyName")
      .equalsIgnoreCase(selectedStudyName)
      .toArray();
    return chatpers;
  }, [selectedStudyName]);

  const selectedChapterNames: string[] | undefined = useLiveQuery(async () => {
    if (selectedStudyName == null) {
      return undefined;
    }
    const selectedChapterNames = await db.selectedChapterNames
      .where("studyName")
      .equalsIgnoreCase(selectedStudyName)
      .toArray();

    if (selectedChapterNames.length === 0) {
      return [];
    } else {
      return selectedChapterNames.map((selectedChapterName) => {
        return selectedChapterName.chapterName;
      });
    }
  }, [selectedStudyName]);

  // All lines from the current study and
  // the selected chapters
  const lines: Line[] | undefined = useLiveQuery(async () => {
    if (selectedStudyName == null) {
      return undefined;
    }

    if (selectedChapterNames == null || selectedChapterNames.length === 0) {
      return [];
    }

    const lines = await db.lines
      .where("studyName")
      .equalsIgnoreCase(selectedStudyName)
      .and((line) => {
        return selectedChapterNames.includes(line.chapter.name);
      })
      .toArray();
    return lines;
  }, [selectedStudyName, selectedChapterNames]);

  const selectStudy = useCallback((studyName: string) => {
    db.selectedStudyName.clear();
    db.selectedStudyName.add({ studyName });
  }, []);

  const removeStudy = useCallback(
    (studyName: string) => {
      db.studies.where("name").equalsIgnoreCase(studyName).delete();
      db.chapters.where("studyName").equalsIgnoreCase(studyName).delete();
      db.lines.where("studyName").equalsIgnoreCase(studyName).delete();

      // If the study we're removing is the selected study,
      // then we need to pick a new selected study.

      if (selectedStudyName === studyName) {
        db.selectedStudyName.clear();

        const nextSelectedStudyName = studies
          .map((study) => study.name)
          .filter((sn) => sn !== studyName)[0];

        if (nextSelectedStudyName != null) {
          db.selectedStudyName.put({ studyName: nextSelectedStudyName });
        }
      }
    },
    [selectedStudyName, studies],
  );

  const addSelectedChapterName = useCallback(
    (chapterName: string) => {
      if (selectedStudyName == null) {
        throw new Error("No study selected");
      }

      if (selectedChapterNames == null) {
        throw new Error("No chapters selected");
      }

      if (selectedChapterNames.includes(chapterName)) {
        return;
      }

      db.selectedChapterNames.add({
        studyName: selectedStudyName!,
        chapterName,
      });
    },
    [selectedStudyName, selectedChapterNames],
  );

  const removeSelectedChapterName = useCallback(
    (chapterName: string) => {
      if (selectedStudyName == null) {
        throw new Error("No study selected");
      }

      db.selectedChapterNames
        .where("studyName")
        .equalsIgnoreCase(selectedStudyName!)
        .and((selectedChapterName) => {
          return selectedChapterName.chapterName === chapterName;
        })
        .delete();
    },
    [selectedStudyName],
  );

  const addStudyAndChapters = useCallback(
    (studyAndChapters: StudyChapterAndLines) => {
      const { study, chapters } = studyAndChapters;
      db.studies.add(study);
      chapters.forEach((chapterAndLines) => {
        db.chapters.add(chapterAndLines.chapter);
        for (const line of chapterAndLines.lines) {
          db.lines.add(line);
        }
      });

      // Set a new study as the selected study
      selectStudy(study.name);

      // Select all chapters by default
      db.selectedChapterNames.bulkPut(
        chapters.map((chapter) => {
          return { studyName: study.name, chapterName: chapter.chapter.name };
        }),
      );
    },
    [selectStudy],
  );

  return {
    studies,
    selectedStudyName,
    selectedStudy,
    chapters,
    selectedChapterNames,
    lines,

    addStudyAndChapters,
    removeStudy,
    selectStudy,
    addSelectedChapterName,
    removeSelectedChapterName,
  };
};
