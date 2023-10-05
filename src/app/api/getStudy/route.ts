import { PgnTree } from "@/chess/PgnTree";
import { NextRequest, NextResponse } from "next/server";
import { parsePgnStringToChapters } from "@/chess/PgnParser";
import { Chapter } from "@/chess/Chapter";

export async function POST(req: NextRequest) {
  const data = await req.json();

  const response = await fetch(
    `https://lichess.org/api/study/${data.studyId}.pgn?` +
      new URLSearchParams({
        source: "true",
        orientation: "true",
      })
  );

  const pgnText: string = await response.text();

  const chapters: Chapter[] = parsePgnStringToChapters(pgnText);

  return NextResponse.json({
    studyName: chapters[0].studyName,
    chapters: chapters,
  });
}
