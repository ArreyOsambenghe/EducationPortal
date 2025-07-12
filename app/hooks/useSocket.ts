// hooks/useSocket.ts
"use client"

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from "@/app/lib/socket.server"

// Client Socket type: receives ServerToClient, emits ClientToServer
type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>

interface UseSocketProps {
  userId: string
  userRole: "teacher" | "student"
  userName: string
  token?: string
}

export const useSocket = ({ userId, userRole, userName, token }: UseSocketProps) => {
  const [socket, setSocket] = useState<SocketType | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map())
  const socketRef = useRef<SocketType | null>(null)

  useEffect(() => {
    if (!userId || socketRef.current) return

    const initSocket = async () => {
      try {
        // Warm up API route to initialize server.io
        await fetch(`/api/socket`)

        // Build auth token
        const authToken = token || btoa(JSON.stringify({ userId, role: userRole, name: userName }))

        // Connect to Socket.IO at correct endpoint
        const socketUrl = window.location.origin
        const newSocket: SocketType = io(socketUrl, {
          path: "/api/socket",
          auth: { token: authToken },
          transports: ["websocket", "polling"],
          upgrade: true,
          reconnection: true,
          reconnectionAttempts: 5,
          transportOptions: {
            polling: {
              extraHeaders: {
                Authorization: `Bearer ${authToken}`,
              },
            },
          },
        })

        // Connection event handlers
        newSocket.on("connect", () => {
          console.log("✅ Connected to socket server", newSocket.id)
          setIsConnected(true)
          newSocket.emit("user:online", userId)
        })

        newSocket.on("disconnect", (reason) => {
          console.log("🔌 Disconnected from socket server", reason)
          setIsConnected(false)
        })

        newSocket.on("connect_error", (err) => {
          console.error("❌ Socket connect error:", err.message)
          setTimeout(() => {
            // attempt reconnect
            newSocket.connect()
          }, 2000)
        })

        // Update online/offline users list
        newSocket.on("user:online", ({ userId: uid, isOnline }) => {
          setOnlineUsers((prev) => {
            const next = new Set(prev)
            isOnline ? next.add(uid) : next.delete(uid)
            return next
          })
        })

        // Typing indicators
        newSocket.on(
          "user:typing",
          ({ conversationId, userId: uid, isTyping }) => {
            setTypingUsers((prev) => {
              const next = new Map(prev)
              const convSet = next.get(conversationId) || new Set<string>()
              isTyping ? convSet.add(uid) : convSet.delete(uid)
              if (convSet.size) next.set(conversationId, convSet)
              else next.delete(conversationId)
              return next
            })
          }
        )

        socketRef.current = newSocket
        setSocket(newSocket)
      } catch (err) {
        console.error("Failed to initialize socket:", err)
      }
    }

    initSocket()

    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
    }
  }, [userId, userRole, userName, token])

  const joinConversation = (conversationId: string) => {
    if (socket && isConnected) socket.emit("join:conversation", conversationId)
  }

  const leaveConversation = (conversationId: string) => {
    if (socket && isConnected) socket.emit("leave:conversation", conversationId)
  }

  const startTyping = (conversationId: string) => {
    if (socket && isConnected) socket.emit("typing:start", { conversationId, userId, userName })
  }

  const stopTyping = (conversationId: string) => {
    if (socket && isConnected) socket.emit("typing:stop", { conversationId, userId })
  }

  const onNewMessage = (cb: (data: any) => void) => {
    socket?.on("message:new", cb)
    return () => socket?.off("message:new", cb)
  }

  const onMessageRead = (cb: (data: any) => void) => {
    socket?.on("message:read", cb)
    return () => socket?.off("message:read", cb)
  }

  const onNewConversation = (cb: (data: any) => void) => {
    socket?.on("conversation:new", cb)
    return () => socket?.off("conversation:new", cb)
  }

  const getTypingUsers = (conversationId: string) =>
    Array.from(typingUsers.get(conversationId) || [])

  const isUserOnline = (uid: string) => onlineUsers.has(uid)

  return {
    socket,
    isConnected,
    onlineUsers: Array.from(onlineUsers),
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    onNewMessage,
    onMessageRead,
    onNewConversation,
    getTypingUsers,
    isUserOnline
  }
}
