import { Chapter } from "@/chess/Chapter";
import {
  ChapterAndLines,
  StudyChapterAndLines,
} from "@/chess/StudyChapterAndLines";
import { getLinesForPlayer } from "./LineExtractor";
import { parsePgnStringToChapters } from "./PgnParser";

export const fetchStudy = async (
  studyId: string,
): Promise<StudyChapterAndLines> => {
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

  const chapterAndLines: ChapterAndLines[] = chapters.map((chapter) => {
    const lines = getLinesForPlayer(studyName, chapter);
    return { chapter, lines };
  });

  if (chapterAndLines.length === 0) {
    throw new Error("Study has no chapters");
  }

  const studyName = chapterAndLines[0].chapter.studyName;

  return {
    study: {
      name: studyName,
      url: studyId,
    },
    chapters: chapterAndLines,
  };
};
