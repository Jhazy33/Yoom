import { NextRequest, NextResponse } from "next/server";
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAude_Code_OAUTH_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const { videoId, transcript, question, history } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // Build context from transcript
    const transcriptContext = transcript
      ? `Video Transcript:\n${transcript}\n\n`
      : "No transcript available for this video.\n\n";

    // Build conversation history
    const messages = history?.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content,
    })) || [];

    // Add system prompt and current question
    const conversation = [
      {
        role: "user" as const,
        content: `${transcriptContext}You are a helpful assistant analyzing a video recording. Answer questions about the video content based on the transcript provided. Be concise and specific.`,
      },
      ...messages,
      {
        role: "user" as const,
        content: question,
      },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: conversation,
    });

    const answer = response.content[0].type === 'text'
      ? response.content[0].text
      : "Unable to generate response";

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process chat" },
      { status: 500 }
    );
  }
}
