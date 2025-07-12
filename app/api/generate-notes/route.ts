import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  try {
    const { content, fileName } = await request.json()

    const { text: notes } = await generateText({
      model: google("gemini-2.0-flash-exp"),
      prompt: `Create comprehensive study notes for the following content from "${fileName}".

Content: ${content}

Please create well-structured study notes that include:
1. Main concepts and definitions
2. Key points organized by topic
3. Important facts and figures
4. Relationships between concepts
5. Memory aids or mnemonics where helpful

Format the notes in a clear, student-friendly way with proper headings and bullet points.`,
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error("Error generating notes:", error)
    return NextResponse.json({ error: "Failed to generate notes" }, { status: 500 })
  }
}
