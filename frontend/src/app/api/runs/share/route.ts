import { NextRequest, NextResponse } from "next/server";
import { Client } from "langsmith";

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function shareRunWithRetry(
  lsClient: Client,
  runId: string
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await lsClient.shareRun(runId);
    } catch (error) {
      console.warn(
        `Attempt ${attempt} failed. ${attempt < MAX_RETRIES ? `Retrying in ${RETRY_DELAY / 1000} seconds...` : "Max retries reached."}`
      );
      
      if (attempt === MAX_RETRIES) {
        console.error("ShareRun error details:", error);
        throw error;
      }
      
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error("Max retries reached"); // This line should never be reached due to the throw in the loop
}

export async function POST(req: NextRequest) {
  const { runId } = await req.json();

  if (!runId) {
    return new NextResponse(
      JSON.stringify({
        error: "`runId` is required to share run.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_LANGSMITH_API_KEY;
  if (!apiKey) {
    console.warn("LangSmith API Key is not set");
    return new NextResponse(
      JSON.stringify({ 
        error: "LangSmith API Key is not configured.", 
        sharedRunURL: `https://smith.langchain.com/disabled/${runId}` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const lsClient = new Client({
    apiKey: apiKey,
  });

  try {
    const sharedRunURL = await shareRunWithRetry(lsClient, runId);

    return new NextResponse(JSON.stringify({ sharedRunURL }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      `Failed to share run with id ${runId} after ${MAX_RETRIES} attempts:\n`,
      error
    );
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to share run after multiple attempts.",
        sharedRunURL: `https://smith.langchain.com/error/${runId}`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
