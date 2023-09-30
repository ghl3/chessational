import { PgnTree } from "@/chess/PgnTree";
import { NextRequest, NextResponse } from "next/server";
import { parsePgnString } from "@/chess/PgnParser";

export async function POST(req: NextRequest) {
  const data = await req.json();

  const response = await fetch(
    `https://lichess.org/api/study/${data.studyId}.pgn`
  );

  const pgn = await response.text();

  const pgns: PgnTree[] = parsePgnString(pgn);

  return NextResponse.json({ pgns: pgns });
}
