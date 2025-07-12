"use client"

import { useState, useEffect, useTransition, useRef } from "react"
import type React from "react"
import {
  getConversations,
  getMessages,
  sendMessage,
  createPrivateConversation,
  markAsRead,
  getCourseParticipants,
} from "@/app/actions/teacher/discussion.action"
import { toast } from "sonner"
import { MessageCircle, Users, Send, Search, Plus, Paperclip, MoreVertical, Check, CheckCheck, Wifi, WifiOff } from "lucide-react"
import { getCourses } from "@/app/actions/teacher/course.action"
import { useSocket } from "@/app/hooks/useSocket"

// Types
type Course = {
  id: string
  name: string
  code: string
  semester: string
  credits: number
  schedule: string
  room: string
  enrolledStudents: number
  status: "active" | "completed" | "upcoming"
  description: string
}

type Message = {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderRole: "teacher" | "student"
  content: string
  timestamp: string
  attachments?: Attachment[]
  readBy: string[]
  edited?: boolean
  editedAt?: string
}

type Attachment = {
  id: string
  name: string
  url: string
  type: string
  size: string
}

type Conversation = {
  id: string
  type: "private" | "group"
  title: string
  courseId?: string
  courseName?: string
  participants: any[]
  lastMessage?: Message
  unreadCount: number
  createdAt: string
  updatedAt: string
}

type CurrentUser = {
  id: string
  name: string
  email: string
  avatar?: string
  role: "teacher" | "student"
  lastSeen?: string
}
type Props = {
  user:{
    id:string,
    name:string,
    email:string,
    role:string,
  }
}
export default function CourseDiscussions({user}:Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [isPending, startTransition] = useTransition()
  const [currentUser] = useState<CurrentUser>({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as 'student' | 'teacher',
  })

  // Typing indicator state
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize Socket.IO
  const {
    socket,
    isConnected,
    onlineUsers,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    onNewMessage,
    onMessageRead,
    onNewConversation,
    getTypingUsers,
    isUserOnline
  } = useSocket({
    userId: currentUser.id,
    userRole: currentUser.role,
    userName: currentUser.name,
  })

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const [conversationsResult, coursesResult] = await Promise.all([
        getConversations(currentUser.id),
        getCourses()
      ])

      if (conversationsResult.success) {
        setConversations(conversationsResult.data || [])
      }

      if (coursesResult.success) {
        setCourses(coursesResult.data || [])
      }
    }
    loadData()
  }, [currentUser.id])

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      const loadMessages = async () => {
        const result = await getMessages(selectedConversation.id)
        if (result.success) {
          setMessages(result.data || [])
          // Mark conversation as read
          await markAsRead(selectedConversation.id, currentUser.id, currentUser.role)
          // Update conversation unread count
          setConversations((prev) =>
            prev.map((conv) => (conv.id === selectedConversation.id ? { ...conv, unreadCount: 0 } : conv)),
          )
        }
      }
      loadMessages()
      
      // Join the conversation room
      joinConversation(selectedConversation.id)
      
      // Leave the previous conversation room when changing conversations
      return () => {
        leaveConversation(selectedConversation.id)
      }
    }
  }, [selectedConversation, currentUser.id, currentUser.role, joinConversation, leaveConversation])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const unsubscribeNewMessage = onNewMessage?.((data) => {
      if (data.senderId !== currentUser.id) {
        setMessages((prev) => [...prev, data.message])
        
        // Update conversation last message if it's the current conversation
        if (selectedConversation?.id === data.conversationId) {
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === data.conversationId
                ? { ...conv, lastMessage: data.message, updatedAt: data.message.timestamp }
                : conv,
            ),
          )
        } else {
          // Update unread count for other conversations
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === data.conversationId
                ? { ...conv, unreadCount: conv.unreadCount + 1, lastMessage: data.message, updatedAt: data.message.timestamp }
                : conv,
            ),
          )
        }
      }
    })

    const unsubscribeMessageRead = onMessageRead?.((data) => {
      if (data.readerId !== currentUser.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            data.messageIds.includes(msg.id)
              ? { ...msg, readBy: [...(msg.readBy || []), data.readerId] }
              : msg
          )
        )
      }
    })

    const unsubscribeNewConversation = onNewConversation?.((data) => {
      if (data.participantIds.includes(currentUser.id)) {
        setConversations((prev) => [data.conversation, ...prev])
        toast.success("New conversation created!")
      }
    })

    return () => {
      unsubscribeNewMessage?.()
      unsubscribeMessageRead?.()
      unsubscribeNewConversation?.()
    }
  }, [socket, currentUser.id, selectedConversation, onNewMessage, onMessageRead, onNewConversation])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle typing indicators
  const handleTyping = () => {
    if (!selectedConversation) return

    if (!isTyping) {
      setIsTyping(true)
      startTyping(selectedConversation.id)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      stopTyping(selectedConversation.id)
    }, 1000)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedConversation) return

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false)
      stopTyping(selectedConversation.id)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }

    const tempMessage = messageText.trim()
    setMessageText("")

    startTransition(async () => {
      const result = await sendMessage({
        conversationId: selectedConversation.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        content: tempMessage,
      })

      if (result.success && result.data) {
        setMessages((prev) => [...prev, result.data])
        // Update conversation last message
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversation.id
              ? { ...conv, lastMessage: result.data, updatedAt: result.data.timestamp }
              : conv,
          ),
        )
      } else {
        toast.error("Failed to send message")
        setMessageText(tempMessage) // Restore message text on error
      }
    })
  }

  const handleCreatePrivateConversation = async (studentId: string) => {
    startTransition(async () => {
      const result = await createPrivateConversation(currentUser.id, studentId)
      if (result.success && result.data) {
        // Refresh conversations to get the new one
        const conversationsResult = await getConversations(currentUser.id)
        if (conversationsResult.success) {
          setConversations(conversationsResult.data || [])
        }
        setShowNewConversation(false)
        toast.success("Private conversation created successfully")
      } else {
        toast.error("Failed to create private conversation")
      }
    })
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.participants.some((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else if (diffInHours < 168) {
      // Less than a week
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  // Get typing users for current conversation
  const typingUsers = selectedConversation ? getTypingUsers(selectedConversation.id) : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Discussions</h1>
            <div className="flex items-center space-x-2">
              <p className="text-gray-600">Communicate with students privately</p>
              <div className="flex items-center space-x-1">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowNewConversation(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Private Conversation</span>
          </button>
        </div>

        <div
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          style={{ height: "calc(100vh - 200px)" }}
        >
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No conversations found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredConversations.map((conversation) => {
                      const otherParticipants = conversation.participants.filter(p => p.id !== currentUser.id)
                      const hasOnlineParticipants = otherParticipants.some(p => isUserOnline(p.id))
                      
                      return (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation)}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedConversation?.id === conversation.id ? "bg-blue-50 border-r-2 border-blue-500" : ""
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 relative">
                              {conversation.type === "group" ? (
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="w-5 h-5 text-blue-600" />
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {otherParticipants[0]?.name?.charAt(0) || "U"}
                                  </div>
                                </div>
                              )}
                              {hasOnlineParticipants && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-900 truncate">{conversation.title}</h3>
                                {conversation.unreadCount > 0 && (
                                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                              {conversation.courseName && (
                                <p className="text-xs text-blue-600 mb-1">{conversation.courseName}</p>
                              )}
                              <p className="text-xs text-gray-500 mb-1">
                                {conversation.participants.length} participant
                                {conversation.participants.length !== 1 ? "s" : ""}
                              </p>
                              {conversation.lastMessage && (
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-gray-600 truncate">
                                    <span className="font-medium">{conversation.lastMessage.senderName}:</span>{" "}
                                    {conversation.lastMessage.content}
                                  </p>
                                  <span className="text-xs text-gray-400 ml-2">
                                    {formatTime(conversation.lastMessage.timestamp)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{selectedConversation.title}</h2>
                        {selectedConversation.courseName && (
                          <p className="text-sm text-blue-600">{selectedConversation.courseName}</p>
                        )}
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-500">
                            {selectedConversation.participants.length} participant
                            {selectedConversation.participants.length !== 1 ? "s" : ""}
                          </p>
                          {selectedConversation.participants.some(p => p.id !== currentUser.id && isUserOnline(p.id)) && (
                            <span className="text-xs text-green-600 font-medium">• Online</span>
                          )}
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-md">
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage = message.senderId === currentUser.id

                      return (
                        <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? "order-2" : "order-1"}`}>
                            {!isOwnMessage && (
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                  {message.senderName.charAt(0)}
                                </div>
                                <span className="text-xs font-medium text-gray-900">{message.senderName}</span>
                                <span className="text-xs text-gray-500">
                                  {message.senderRole === "teacher" ? "Teacher" : "Student"}
                                </span>
                                {isUserOnline(message.senderId) && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                )}
                              </div>
                            )}
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isOwnMessage ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {message.attachments.map((attachment) => (
                                    <div
                                      key={attachment.id}
                                      className={`flex items-center space-x-2 p-2 rounded ${
                                        isOwnMessage ? "bg-blue-500" : "bg-gray-200"
                                      }`}
                                    >
                                      <Paperclip className="w-3 h-3" />
                                      <span className="text-xs truncate">{attachment.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div
                              className={`flex items-center space-x-1 mt-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                            >
                              <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                              {isOwnMessage && (
                                <div className="flex items-center">
                                  {message.readBy.length > 1 ? (
                                    <CheckCheck className="w-3 h-3 text-blue-500" />
                                  ) : (
                                    <Check className="w-3 h-3 text-gray-400" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex justify-start">
                        <div className="max-w-xs lg:max-w-md">
                          <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                            <div className="flex items-center space-x-1">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                              </div>
                              <span className="text-xs text-gray-600 ml-2">typing...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                      <div className="flex-1">
                        <textarea
                          value={messageText}
                          onChange={(e) => {
                            setMessageText(e.target.value)
                            handleTyping()
                          }}
                          placeholder="Type your message..."
                          rows={1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage(e)
                            }
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <button
                        type="submit"
                        disabled={!messageText.trim() || isPending}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-md"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Private Conversation Modal */}
      {showNewConversation && (
        <NewPrivateConversationModal
          isOpen={showNewConversation}
          onClose={() => setShowNewConversation(false)}
          onSubmit={handleCreatePrivateConversation}
          courses={courses}
          isPending={isPending}
        />
      )}
    </div>
  )
}

// New Private Conversation Modal Component
// New Private Conversation Modal Component
function NewPrivateConversationModal({
  isOpen,
  onClose,
  onSubmit,
  courses,
  isPending,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (studentId: string) => Promise<void>
  courses: Course[]
  isPending: boolean
}) {
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Load students when course is selected
  useEffect(() => {
    if (selectedCourse) {
      const loadStudents = async () => {
        const result = await getCourseParticipants(selectedCourse)
        if (result.success) setAvailableStudents(result.data || [])
      }
      loadStudents()
    } else {
      setAvailableStudents([])
      setSelectedStudent("")
    }
  }, [selectedCourse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return
    await onSubmit(selectedStudent)
  }

  const filteredStudents = availableStudents.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">New Private Conversation</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCourse && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                <div className="border border-gray-300 rounded-md">
                  <div className="p-2 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-1 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredStudents.map((student) => (
                      <label
                        key={student.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="student"
                          value={student.id}
                          checked={selectedStudent === student.id}
                          onChange={() => setSelectedStudent(student.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300"
                        />
                        <span className="text-sm text-gray-900">{student.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedStudent || isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}