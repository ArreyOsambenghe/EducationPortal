import { GoogleGenerativeAI } from "@google/generative-ai"
import type { NextRequest } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GENERATIVE_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { messages, mode = "chat" } = await request.json()

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: mode === "exercise" ? 0.8 : 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    })

    // Create system prompt based on mode
    const systemPrompts = {
      chat: "You are an AI tutor helping students learn. Be encouraging, clear, and educational.",
      exercise:
        "Generate practice exercises, quizzes, or problems for the student. Include solutions and explanations.",
      analysis: "Analyze the student's work, provide detailed feedback, identify strengths and areas for improvement.",
      explanation: "Provide clear, step-by-step explanations of concepts. Use examples and analogies when helpful.",
    }

    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }))

    // Add system prompt as first message
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompts[mode as keyof typeof systemPrompts] }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'm ready to help you learn!" }],
        },
        ...conversationHistory.slice(0, -1),
      ],
    })

    const lastMessage = conversationHistory[conversationHistory.length - 1]
    const result = await chat.sendMessageStream(lastMessage.parts[0].text)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`))
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API Error:", error)
    return Response.json({ error: "Failed to process request" }, { status: 500 })
  }
}
