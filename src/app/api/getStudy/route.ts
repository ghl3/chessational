import { NextRequest } from "next/server";

export const runtime = "edge";

export const POST = async (req: NextRequest) => {
  try {
    const data: { studyId: string } = await req.json();

    const response = await fetch(
      `https://lichess.org/api/study/${data.studyId}.pgn?` +
        new URLSearchParams({
          source: "true",
          orientation: "true",
        })
    );

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText, {
        status: response.status,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

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
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      return new Response(`Internal Server Error: ${error.message}`, {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    } else {
      // Handle non-Error objects
      return new Response(`Internal Server Error`, {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
  }
};
