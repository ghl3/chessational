import { NextRequest } from "next/server";
//import { parsePgnStringToChapters } from "@/utils/PgnParser";
//import { Chapter } from "@/chess/Chapter";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const data: { studyId: string } = await req.json();

  //  return new Response(JSON.stringify(data));

  const response = await fetch(
    `https://lichess.org/api/study/${data.studyId}.pgn?` +
      new URLSearchParams({
        source: "true",
        orientation: "true",
      }),
  );

  const pgnText: string = await response.text();

  // const chapters: Chapter[] = parsePgnStringToChapters(pgnText);

  return new Response(
    JSON.stringify({
      pgnText: pgnText,
      //studyName: chapters[0].studyName,
      //chapters: chapters,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
