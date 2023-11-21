import { Chapter } from "@/chess/Chapter";
import { Study } from "@/chess/Study";
import { parsePgnStringToChapters } from "./PgnParser";

export const fetchStudy = async (studyId: string): Promise<Study> => {
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
