import { NextRequest, NextResponse } from "next/server";
import { evaluateArchitecture } from "@/lib/ai/gemini-client";
import { ArchitectureBlueprint } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { message, architecture } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!architecture) {
      return NextResponse.json(
        { error: "Architecture context is required for evaluation" },
        { status: 400 }
      );
    }

    const reply = await evaluateArchitecture(
      architecture as ArchitectureBlueprint,
      message
    );

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}


