import { NextRequest } from "next/server";

export const runtime = "edge";

export const POST = async (req: NextRequest) => {
  try {
    const data: { studyId: string } = await req.json();

    if (!data.studyId || typeof data.studyId !== "string") {
      return new Response("Invalid study ID provided", {
        status: 400,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    const response = await fetch(
      `https://lichess.org/api/study/${data.studyId}.pgn?` +
        new URLSearchParams({
          source: "true",
          orientation: "true",
        }),
    );

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage =
        response.status === 404
          ? `Study not found: ${data.studyId}`
          : `Failed to fetch study: ${errorText || response.statusText}`;
      return new Response(errorMessage, {
        status: response.status,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    const pgnText: string = await response.text();

    if (!pgnText || pgnText.trim().length === 0) {
      return new Response("Study has no content", {
        status: 400,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

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
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? `Internal Server Error: ${error.message}`
        : "Internal Server Error: Unknown error occurred";
    return new Response(errorMessage, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
};
