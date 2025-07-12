"use client"

import type React from "react"

import type { ChatMode } from "../page"

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  mode: ChatMode
}

export function ChatInput({ input, setInput, onSubmit, isLoading, mode }: ChatInputProps) {
  const getPlaceholder = (mode: ChatMode) => {
    switch (mode) {
      case "exercise":
        return "Request practice problems, quizzes, or exercises..."
      case "analysis":
        return "Share your work for detailed analysis and feedback..."
      case "explanation":
        return "Ask for explanations of concepts or topics..."
      default:
        return "Ask me anything about your studies..."
    }
  }

  const getModeColor = (mode: ChatMode) => {
    switch (mode) {
      case "exercise":
        return "focus:ring-green-500 focus:border-green-500"
      case "analysis":
        return "focus:ring-purple-500 focus:border-purple-500"
      case "explanation":
        return "focus:ring-yellow-500 focus:border-yellow-500"
      default:
        return "focus:ring-blue-500 focus:border-blue-500"
    }
  }

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <form onSubmit={onSubmit} className="flex space-x-3">
        <div className="flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={getPlaceholder(mode)}
            className={`w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 ${getModeColor(mode)} transition-colors`}
            rows={1}
            style={{ minHeight: "48px", maxHeight: "120px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                onSubmit(e)
              }
            }}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 ${
            !input.trim() || isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:scale-95"
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "📤"
          )}
        </button>
      </form>
    </div>
  )
}
