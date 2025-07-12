import type { Message } from "../page"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  const getModeIcon = (mode?: string) => {
    switch (mode) {
      case "exercise":
        return "📝"
      case "analysis":
        return "🔍"
      case "explanation":
        return "💡"
      default:
        return "💬"
    }
  }

  const getModeColor = (mode?: string) => {
    switch (mode) {
      case "exercise":
        return "bg-green-500"
      case "analysis":
        return "bg-purple-500"
      case "explanation":
        return "bg-yellow-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-3xl ${isUser ? "order-2" : "order-1"}`}>
        <div className={`flex items-start space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
              isUser ? "bg-blue-600" : "bg-gray-600"
            }`}
          >
            {isUser ? "👤" : "🤖"}
          </div>

          <div
            className={`rounded-2xl px-4 py-3 shadow-sm border ${
              isUser ? "bg-blue-600 text-white" : "bg-white text-gray-800"
            }`}
          >
            {message.mode && !isUser && (
              <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-gray-200">
                <span className={`w-3 h-3 rounded-full ${getModeColor(message.mode)}`}></span>
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {message.mode} {getModeIcon(message.mode)}
                </span>
              </div>
            )}

            <div className="whitespace-pre-wrap break-words">{message.content}</div>

            <div className={`text-xs mt-2 ${isUser ? "text-blue-100" : "text-gray-500"}`}>
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
