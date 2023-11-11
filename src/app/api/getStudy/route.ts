import { NextRequest } from "next/server";

export const runtime = "edge";

export const POST = async (req: NextRequest) => {
  const data: { studyId: string } = await req.json();

  const response = await fetch(
    `https://lichess.org/api/study/${data.studyId}.pgn?` +
      new URLSearchParams({
        source: "true",
        orientation: "true",
      }),
  );

  const pgnText: string = await response.text();

  return new Response(
    JSON.stringify({
      pgnText: pgnText,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
