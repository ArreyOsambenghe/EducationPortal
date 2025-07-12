"use client"

import type { ChatMode } from "../page"

interface ModeSelectorProps {
  mode: ChatMode
  onModeChange: (mode: ChatMode) => void
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const modes = [
    { id: "chat" as ChatMode, label: "General Chat", icon: "💬", color: "blue" },
    { id: "exercise" as ChatMode, label: "Exercises", icon: "📝", color: "green" },
    { id: "analysis" as ChatMode, label: "Analysis", icon: "🔍", color: "purple" },
    { id: "explanation" as ChatMode, label: "Explanations", icon: "💡", color: "yellow" },
  ]

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive ? "bg-blue-600 text-white" : "text-blue-600 hover:bg-blue-50",
      green: isActive ? "bg-green-600 text-white" : "text-green-600 hover:bg-green-50",
      purple: isActive ? "bg-purple-600 text-white" : "text-purple-600 hover:bg-purple-50",
      yellow: isActive ? "bg-yellow-600 text-white" : "text-yellow-600 hover:bg-yellow-50",
    }
    return colors[color as keyof typeof colors]
  }

  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <div className="flex flex-wrap gap-2">
        {modes.map((modeOption) => (
          <button
            key={modeOption.id}
            onClick={() => onModeChange(modeOption.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${getColorClasses(
              modeOption.color,
              mode === modeOption.id,
            )} border border-gray-200`}
          >
            <span className="mr-2">{modeOption.icon}</span>
            {modeOption.label}
          </button>
        ))}
      </div>
    </div>
  )
}
