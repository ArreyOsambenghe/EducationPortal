"use client"

import Parser from "@/app/utils/parser"
import { Bot, CheckCircle, Clock, Loader2, TabletSmartphone, User } from "lucide-react"
import { useRef, useEffect } from "react"
export interface ChatMessage {
  id: string
  type: "user" | "model" | "function" | "completed"
  content?: string
  timestamp: Date
  task?: FunctionCall[]
  sendStatus?: "loading" | "completed" | 'error'
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}
export interface FunctionCall {
    id:string,
    name:string,
    message:string,
    ai_message_id:string
    status:'loading'|'completed'
}
interface ChatMessagesProps {
  messages: ChatMessage[]
  isTyping: boolean
}

export function ChatMessages({ messages, isTyping }: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  return (
    <div ref={scrollAreaRef} className="flex-1 p-4 overflow-y-auto">
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            {message.type !== "user" && (
              <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-900/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-900" />
                  </div>
              </div>
            )}
            <div
              className={`flex flex-col gap-1 max-w-[280px] ${message.type === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.type === "user"
                    ? "bg-purple-700 text-gray-50"
                      : message.type === "completed"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : message.type === "model" && message.content ? message.sendStatus == 'error'? "bg-red-800/10" : 'bg-gray-100' : "bg-transparent"
                }`}
              > 
                {message.task && !message.content && message.task.length> 0 && (
                  <div className="flex flex-col gap-2">
                    {message.task.sort((a,b) => {
                        const priority = { completed: 0, loading: 1 }; // lower = higher priority
                        return priority[a.status] - priority[b.status]
                    }).map((task) => (
                      <div key={task.id} className={`flex ${task.name == 'thought'? 'items-end':'items-center'}`}>
                        {task.name === 'thought'? <div className="" dangerouslySetInnerHTML={{__html:Parser(task.message)}}></div> :<span className="text-xs text-muted-foreground">{task.message}</span> }
                        {task.status == 'loading' ? (
                          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin duration-500" />):(
                          <div className="size-8 px-2 ml-1 rounded-full bg-green-600/10 flex items-center justify-center">
                            <CheckCircle  className="size-4 text-green-600 " />
                            </div>
                          
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {(message.type === "user" && message.content) && <span>{message.content}</span>}
                {(message.type === "model" && message.content) && <div className="" dangerouslySetInnerHTML={{ __html: Parser(message.content) }}></div>
                }
              </div>
              {message.sendStatus && message.sendStatus === "loading" ? (
                <Clock className="w-4 h-4 animate-spin duration-500" />
              ):(<span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>)}
            </div>

            {message.type === "user" && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
        
      </div>
    </div>
  )
}
