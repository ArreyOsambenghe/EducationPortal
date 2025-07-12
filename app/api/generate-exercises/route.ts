import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

const exerciseSchema = z.object({
  exercises: z.array(
    z.object({
      type: z.enum(["multiple-choice", "short-answer", "essay"]),
      question: z.string(),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string().optional(),
      explanation: z.string().optional(),
    }),
  ),
})

export async function POST(request: NextRequest) {
  try {
    const { content, fileName } = await request.json()

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-exp"),
      schema: exerciseSchema,
      prompt: `Create a variety of practice exercises based on the following content from "${fileName}".

Content: ${content}

Please create 5-7 exercises including:
1. 3-4 multiple choice questions with 4 options each
2. 1-2 short answer questions
3. 1 essay question

For multiple choice questions:
- Provide the correct answer
- Include a brief explanation of why it's correct
- Make distractors plausible but clearly incorrect

For short answer and essay questions:
- Focus on understanding and application
- Encourage critical thinking

Make sure exercises test different levels of understanding (recall, comprehension, application, analysis).`,
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error("Error generating exercises:", error)
    return NextResponse.json({ error: "Failed to generate exercises" }, { status: 500 })
  }
}
