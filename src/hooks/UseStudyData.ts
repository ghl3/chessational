import { db } from "@/app/db";
import { Attempt } from "@/chess/Attempt";
import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { Study } from "@/chess/Study";
import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";

export interface StudyData {
  // Unfiltered data
  studies: Study[]; // All studies
  allChapters?: Chapter[]; // All chapters from ALL studies (for game comparison)

  // Selected studies (multiple)
  selectedStudyNames?: string[]; // The names of the selected studies
  selectedStudies?: Study[]; // The selected studies
  selectedStudyChapters?: Chapter[]; // Chapters from ALL selected studies

  // Selected chapters (across all selected studies)
  selectedChapterNames?: string[]; // The names of the selected chapters (across all studies)
  selectedChapterLines?: Line[]; // Lines from selected chapters only
  selectedChapterAttempts?: Attempt[]; // Attempts for selected chapters only

  // Actions
  addStudyAndChapters: (studyAndChapters: StudyChapterAndLines) => void;
  deleteStudy: (studyName: string) => void;
  addSelectedStudyName: (studyName: string) => void;
  removeSelectedStudyName: (studyName: string) => void;
  setSelectedStudyNames: (studyNames: string[]) => void;
  addSelectedChapterName: (studyName: string, chapterName: string) => void;
  removeSelectedChapterName: (studyName: string, chapterName: string) => void;
  setSelectedChapterNames: (chapters: { studyName: string; chapterName: string }[]) => void;

  // Deprecated - for backward compatibility during migration
  /** @deprecated Use selectedStudyNames instead */
  selectedStudyName?: string;
  /** @deprecated Use selectedStudies[0] instead */
  selectedStudy?: Study;
  /** @deprecated Use addSelectedStudyName instead */
  selectStudy: (studyName: string) => void;
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

  // All chapters from ALL studies (for game comparison across entire repertoire)
  const allChapters: Chapter[] | undefined = useLiveQuery(
    async () => {
      const chapters = await db.chapters.toArray();
      return chapters || [];
    },
    [],
    undefined, // undefined while loading
  );

  // Selected study names (multiple)
  const selectedStudyNames: string[] | undefined = useLiveQuery(
    async () => {
      const selected = await db.selectedStudyNames.toArray();
      return selected.map((s) => s.studyName);
    },
    [],
    undefined,
  );

  // Selected studies (multiple)
  const selectedStudies: Study[] | undefined = useLiveQuery(
    async () => {
      if (!selectedStudyNames || selectedStudyNames.length === 0) {
        return [];
      }
      const studyList = await db.studies
        .where("name")
        .anyOfIgnoreCase(selectedStudyNames)
        .toArray();
      return studyList;
    },
    [selectedStudyNames],
    undefined,
  );

  // Chapters from ALL selected studies
  const selectedStudyChapters: Chapter[] | undefined = useLiveQuery(
    async () => {
      if (!selectedStudyNames || selectedStudyNames.length === 0) {
        return [];
      }
      const chapters = await db.chapters
        .where("studyName")
        .anyOfIgnoreCase(selectedStudyNames)
        .sortBy("chapterIndex");
      // Sort by study name first, then chapter index
      return chapters.sort((a, b) => {
        const studyCompare = a.studyName.localeCompare(b.studyName);
        if (studyCompare !== 0) return studyCompare;
        return a.chapterIndex - b.chapterIndex;
      });
    },
    [selectedStudyNames],
    undefined,
  );

  // Selected chapter names across all selected studies
  const selectedChapterNames: string[] | undefined = useLiveQuery(
    async () => {
      if (!selectedStudyNames || selectedStudyNames.length === 0) {
        return undefined;
      }
      const selectedChapters = await db.selectedChapterNames
        .where("studyName")
        .anyOfIgnoreCase(selectedStudyNames)
        .toArray();

      if (selectedChapters.length === 0) {
        return [];
      }
      return selectedChapters.map((sc) => sc.chapterName);
    },
    [selectedStudyNames],
    undefined,
  );

  // Full selected chapter records (studyName + chapterName) for filtering
  const selectedChapterRecords = useLiveQuery(
    async () => {
      if (!selectedStudyNames || selectedStudyNames.length === 0) {
        return [];
      }
      return db.selectedChapterNames
        .where("studyName")
        .anyOfIgnoreCase(selectedStudyNames)
        .toArray();
    },
    [selectedStudyNames],
    [],
  );

  // Lines from the selected chapters (across all selected studies)
  const selectedChapterLines: Line[] | undefined = useLiveQuery(
    async () => {
      if (!selectedStudyNames || selectedStudyNames.length === 0) {
        return undefined;
      }

      if (!selectedChapterRecords || selectedChapterRecords.length === 0) {
        return [];
      }

      // Create a set of "studyName|chapterName" for fast lookup
      const selectedSet = new Set(
        selectedChapterRecords.map((sc) => `${sc.studyName}|${sc.chapterName}`)
      );

      const lines = await db.lines
        .where("studyName")
        .anyOfIgnoreCase(selectedStudyNames)
        .and((line) => selectedSet.has(`${line.studyName}|${line.chapterName}`))
        .toArray();

      return lines;
    },
    [selectedStudyNames, selectedChapterRecords],
    undefined,
  );

  // Attempts for the selected chapters (across all selected studies)
  const selectedChapterAttempts: Attempt[] | undefined = useLiveQuery(
    async () => {
      if (!selectedStudyNames || selectedStudyNames.length === 0) {
        return undefined;
      }

      if (!selectedChapterRecords || selectedChapterRecords.length === 0) {
        return [];
      }

      // Create a set of "studyName|chapterName" for fast lookup
      const selectedSet = new Set(
        selectedChapterRecords.map((sc) => `${sc.studyName}|${sc.chapterName}`)
      );

      const attempts = await db.attempts
        .where("studyName")
        .anyOfIgnoreCase(selectedStudyNames)
        .and((attempt) => selectedSet.has(`${attempt.studyName}|${attempt.chapterName}`))
        .toArray();

      return attempts;
    },
    [selectedStudyNames, selectedChapterRecords],
    undefined,
  );

  // Actions
  const addSelectedStudyName = useCallback((studyName: string) => {
    db.selectedStudyNames.put({ studyName });
  }, []);

  const removeSelectedStudyName = useCallback((studyName: string) => {
    db.selectedStudyNames.where("studyName").equalsIgnoreCase(studyName).delete();
    // Also remove chapter selections for this study
    db.selectedChapterNames.where("studyName").equalsIgnoreCase(studyName).delete();
  }, []);

  const setSelectedStudyNames = useCallback((studyNames: string[]) => {
    db.transaction("rw", db.selectedStudyNames, db.selectedChapterNames, async () => {
      // Get current selections to know what to remove
      const current = await db.selectedStudyNames.toArray();
      const currentNames = current.map((s) => s.studyName);
      
      // Remove studies that are no longer selected
      const toRemove = currentNames.filter((name) => !studyNames.includes(name));
      for (const name of toRemove) {
        await db.selectedStudyNames.where("studyName").equalsIgnoreCase(name).delete();
        // Also remove chapter selections for removed studies
        await db.selectedChapterNames.where("studyName").equalsIgnoreCase(name).delete();
      }
      
      // Add newly selected studies
      const toAdd = studyNames.filter((name) => !currentNames.includes(name));
      await db.selectedStudyNames.bulkPut(toAdd.map((name) => ({ studyName: name })));
    });
  }, []);

  // Deprecated: Select a single study (clears others)
  const selectStudy = useCallback((studyName: string) => {
    db.transaction("rw", db.selectedStudyNames, db.selectedChapterNames, async () => {
      await db.selectedStudyNames.clear();
      await db.selectedStudyNames.add({ studyName });
    });
  }, []);

  const deleteStudy = useCallback(
    (studyName: string) => {
      db.studies.where("name").equalsIgnoreCase(studyName).delete();
      db.chapters.where("studyName").equalsIgnoreCase(studyName).delete();
      db.lines.where("studyName").equalsIgnoreCase(studyName).delete();
      db.selectedChapterNames.where("studyName").equalsIgnoreCase(studyName).delete();

      // If the study we're removing is selected, remove it from selections
      if (selectedStudyNames?.includes(studyName)) {
        db.selectedStudyNames.where("studyName").equalsIgnoreCase(studyName).delete();

        // If this was the only selected study, select the next available one
        const remaining = studies
          .map((study) => study.name)
          .filter((sn) => sn !== studyName);

        if (selectedStudyNames.length === 1 && remaining.length > 0) {
          db.selectedStudyNames.put({ studyName: remaining[0] });
        }
      }
    },
    [selectedStudyNames, studies],
  );

  const addSelectedChapterName = useCallback(
    (studyName: string, chapterName: string) => {
      db.selectedChapterNames.put({ studyName, chapterName });
    },
    [],
  );

  const removeSelectedChapterName = useCallback(
    (studyName: string, chapterName: string) => {
      db.selectedChapterNames
        .where("studyName")
        .equalsIgnoreCase(studyName)
        .and((sc) => sc.chapterName === chapterName)
        .delete();
    },
    [],
  );

  const setSelectedChapterNames = useCallback(
    (chapters: { studyName: string; chapterName: string }[]) => {
      db.transaction("rw", db.selectedChapterNames, async () => {
        // Get unique study names from the new selection
        const studyNames = [...new Set(chapters.map((c) => c.studyName))];
        
        // Clear existing selections for these studies
        for (const studyName of studyNames) {
          await db.selectedChapterNames.where("studyName").equalsIgnoreCase(studyName).delete();
        }
        
        // Add new selections
        await db.selectedChapterNames.bulkPut(chapters);
      });
    },
    [],
  );

  const addStudyAndChapters = useCallback(
    (studyAndChapters: StudyChapterAndLines) => {
      const { study, chapters } = studyAndChapters;
      db.studies.add(study);
      chapters.forEach((chapterAndLines) => {
        db.chapters.add(chapterAndLines.chapter);
        for (const line of chapterAndLines.lines) {
          db.lines.add(line).catch((error) => {
            if (error.name === "ConstraintError") {
              // Ignore duplicate key errors
            } else {
              throw error;
            }
          });
        }
      });

      // Add this study to the selected studies
      db.selectedStudyNames.put({ studyName: study.name });

      // Select all chapters by default
      db.selectedChapterNames.bulkPut(
        chapters.map((chapter) => {
          return { studyName: study.name, chapterName: chapter.chapter.name };
        }),
      );
    },
    [],
  );

  // Backward compatibility: first selected study
  const selectedStudyName = selectedStudyNames?.[0];
  const selectedStudy = selectedStudies?.[0];

  return {
    studies,
    allChapters,
    
    // Multi-study selection
    selectedStudyNames,
    selectedStudies,
    selectedStudyChapters,
    selectedChapterNames,
    selectedChapterLines,
    selectedChapterAttempts,

    // Actions
    addStudyAndChapters,
    deleteStudy,
    addSelectedStudyName,
    removeSelectedStudyName,
    setSelectedStudyNames,
    addSelectedChapterName,
    removeSelectedChapterName,
    setSelectedChapterNames,

    // Deprecated (backward compatibility)
    selectedStudyName,
    selectedStudy,
    selectStudy,
  };
};
