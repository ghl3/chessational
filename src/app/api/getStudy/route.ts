import { NextRequest, NextResponse } from "next/server";
import { parse } from "pgn-parser";

export async function POST(req: NextRequest) {
  const data = await req.json();

  const response = await fetch(
    `https://lichess.org/api/study/${data.studyId}.pgn`
  );

  const pgn = await response.text();

  const parsed = parse(pgn);

  const lastGame = parsed[parsed.length - 1];

  const ravs = lastGame.moves[2].ravs;

  console.log(ravs);

  //for (const game of parsed) {
  //  console.log(game);
  // }

  //console.log("START PGN");
  //console.log(pgn);
  //console.log("END PGN");

  //const json = await response.json();

  //console.log(json);

  return NextResponse.json({ foo: "bar" });
}
