import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.json();

  const response = await fetch(
    `https://lichess.org/api/study/${data.studyId}.pgn`
  );

  const pgn = await response.text();

  console.log("START PGN");
  console.log(pgn);
  console.log("END PGN");

  //const json = await response.json();

  //console.log(json);

  return NextResponse.json({ foo: "bar" });
}
