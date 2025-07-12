import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"
import pdfParse from "pdf-parse" // Import the PDF parsing library

// Define the schema for the AI's output
const analysisSchema = z.object({
  keyTopics: z.array(z.string()).describe("Main topics covered in the content"),
  summary: z.string().describe("Brief summary of the content"),
  difficultyLevel: z.number().min(1).max(5).describe("Difficulty level from 1-5, where 1 is easy and 5 is very difficult"),
  difficultyDescription: z.string().describe("A concise description of why the content has this difficulty level"),
  learningObjectives: z.array(z.string()).describe("Specific learning objectives students should achieve after engaging with this content"),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Get the file from the form data
    const formData = await request.formData()
    const file = formData.get("file") as File // 'file' is the name attribute from your input type="file"

    // Check if a file was provided
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // 2. Extract text content based on file type
    let content = ""
    const maxContentLength = 100000; // Define a max content length to prevent exceeding LLM context window

    if (file.type === "text/plain") {
      content = await file.text()
    } else if (file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const data = await pdfParse(Buffer.from(arrayBuffer)) // pdf-parse expects a Buffer
        console.log('data passed',data)
        content = data.text
      } catch (pdfError) {
        console.error("Error parsing PDF:", pdfError)
        return NextResponse.json(
          { error: "Failed to parse PDF file. Ensure it's a valid PDF." },
          { status: 400 }
        )
      }
    } else if (file.type.startsWith("text/")) {
      // Fallback for other text-based files like .md, .csv etc.
      content = await file.text()
    } else {
      // Reject unsupported file types
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Please upload a text file or PDF.` },
        { status: 400 }
      )
    }

    // Check if content extraction yielded anything
    if (!content.trim()) {
      return NextResponse.json(
        { error: "Could not extract readable content from the provided file or file is empty." },
        { status: 400 }
      )
    }

    // Optional: Truncate content if it's too long for the LLM's context window
    if (content.length > maxContentLength) {
        console.warn(`Content truncated from ${content.length} to ${maxContentLength} characters.`);
        content = content.substring(0, maxContentLength);
        // You might want to return an error or warning to the user here
        // if truncation significantly impacts the analysis quality.
    }


    // 3. Analyze content with Gemini using the Vercel AI SDK
    const { object: analysis } = await generateObject({
      // Use a stable and suitable Gemini model
      // 'gemini-1.5-flash' is generally good for speed and cost
      // 'gemini-1.5-pro' offers higher quality for more complex analysis
      model: google("gemini-1.5-flash"),
      schema: analysisSchema,
      prompt: `Analyze the following educational content and provide a structured analysis based on the specified schema. Focus on the core educational aspects.

Content:
${content}

Please ensure your output strictly adheres to the provided JSON schema for key topics, a comprehensive summary, a numerical difficulty level (1-5), a description of that difficulty, and specific learning objectives for students.`,
    })

    // 4. Return the analysis and (optionally) the processed content
    return NextResponse.json({
      // You might not want to return the full content to the client in a production app
      // to save bandwidth and keep response sizes small, but it's fine for debugging.
      // content,
      analysis,
    })
  } catch (error) {
    console.error("Error analyzing file:", error)
    // Provide a more generic error message to the client for security
    return NextResponse.json({ error: "Failed to analyze file due to an internal server error." }, { status: 500 })
  }
}