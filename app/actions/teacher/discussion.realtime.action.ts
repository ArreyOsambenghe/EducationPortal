// actions/teacher/discussion-realtime.action.ts
"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/app/lib/prisma"
import { Server as ServerIO } from "socket.io"
import { NextApiResponseServerIO } from "@/app/lib/socket.server"

// Get Socket.IO instance (you'll need to store this globally or pass it)
let globalSocketIO: ServerIO | null = null

export const setSocketIOInstance = (io: ServerIO) => {
  globalSocketIO = io
}

// Enhanced send message with real-time broadcasting
export async function sendMessageRealtime(messageData: {
  conversationId: string
  senderId: string
  senderName: string
  senderRole: "teacher" | "student"
  content: string
  attachments?: any[]
}) {
  try {
    const isTeacher = messageData.senderRole === "teacher"
    
    const message = await prisma.message.create({
      data: {
        content: messageData.content,
        conversationId: messageData.conversationId,
        senderTeacherId: isTeacher ? messageData.senderId : null,
        senderStudentId: isTeacher ? null : messageData.senderId,
        attachments: messageData.attachments ? {
          create: messageData.attachments.map(att => ({
            name: att.name,
            size: att.size,
            type: att.type,
            fileId: att.id,
          }))
        } : undefined,
      },
      include: {
        senderTeacher: true,
        senderStudent: true,
        attachments: {
          include: {
            file: true,
          }
        },
        readReceipts: {
          include: {
            readerTeacher: true,
            readerStudent: true,
          }
        }
      }
    })

    // Create read receipt for sender
    await prisma.messageReadReceipt.create({
      data: {
        messageId: message.id,
        readerTeacherId: isTeacher ? messageData.senderId : null,
        readerStudentId: isTeacher ? null : messageData.senderId,
      }
    })

    // Update conversation last message timestamp
    await prisma.conversation.update({
      where: { id: messageData.conversationId },
      data: { lastMessageAt: new Date() }
    })

    // Format message for response
    const formattedMessage = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderTeacherId || message.senderStudentId,
      senderName: messageData.senderName,
      senderRole: messageData.senderRole,
      content: message.content,
      timestamp: message.createdAt.toISOString(),
      attachments: message.attachments?.map((att: any) => ({
        id: att.id,
        name: att.name,
        url: att.file.fileUrl,
        type: att.type,
        size: att.size,
      })) || [],
      readBy: [messageData.senderId],
      edited: false,
    }

    // Emit to Socket.IO if available
    if (globalSocketIO) {
      globalSocketIO.to(`conversation:${messageData.conversationId}`).emit("message:new", {
        conversationId: messageData.conversationId,
        message: formattedMessage,
        senderId: messageData.senderId
      })
    }

    revalidatePath("/teacher/discussions")
    return { success: true, data: formattedMessage }
  } catch (error) {
    console.error("Error sending message:", error)
    return { success: false, error: "Failed to send message" }
  }
}

// Enhanced mark as read with real-time broadcasting
export async function markAsReadRealtime(
  conversationId: string, 
  userId: string, 
  userRole: "teacher" | "student"
) {
  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        readReceipts: {
          none: userRole === "teacher" ? {
            readerTeacherId: userId,
          } : {
            readerStudentId: userId,
          }
        }
      }
    })

    const messageIds = messages.map(msg => msg.id)

    if (messageIds.length > 0) {
      await prisma.messageReadReceipt.createMany({
        data: messages.map(message => ({
          messageId: message.id,
          readerTeacherId: userRole === "teacher" ? userId : null,
          readerStudentId: userRole === "student" ? userId : null,
        }))
      })

      // Emit to Socket.IO if available
      if (globalSocketIO) {
        globalSocketIO.to(`conversation:${conversationId}`).emit("message:read", {
          conversationId,
          messageIds,
          readerId: userId
        })
      }
    }

    revalidatePath("/teacher/discussions")
    return { success: true }
  } catch (error) {
    console.error("Error marking as read:", error)
    return { success: false, error: "Failed to mark as read" }
  }
}

// Enhanced create private conversation with real-time broadcasting
export async function createPrivateConversationRealtime(
  teacherId: string, 
  studentId: string
) {
  try {
    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: "PRIVATE",
        participants: {
          every: {
            OR: [
              { teacherId },
              { studentId }
            ]
          }
        }
      },
      include: {
        participants: {
          include: {
            teacher: true,
            student: true,
          }
        }
      }
    })

    if (existingConversation) {
      return { success: true, data: existingConversation }
    }

    // Get student and teacher info
    const [student, teacher] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.teacher.findUnique({ where: { id: teacherId } })
    ])

    if (!student || !teacher) {
      throw new Error("Student or teacher not found")
    }

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        title: `Private conversation with ${student.firstName} ${student.lastName}`,
        type: "PRIVATE",
        participants: {
          create: [
            { teacherId },
            { studentId }
          ]
        }
      },
      include: {
        participants: {
          include: {
            teacher: true,
            student: true,
          }
        }
      }
    })

    // Format conversation for response
    const formattedConversation = {
      id: conversation.id,
      type: "private" as const,
      title: conversation.title,
      participants: conversation.participants.map(participant => ({
        id: participant.teacher?.id || participant.student?.id,
        name: participant.teacher 
          ? `${participant.teacher.firstName} ${participant.teacher.lastName}`
          : `${participant.student?.firstName} ${participant.student?.lastName}`,
        email: participant.teacher?.email || participant.student?.email,
        role: participant.teacher ? "teacher" : "student",
      })),
      unreadCount: 0,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    }

    // Emit to Socket.IO if available
    if (globalSocketIO) {
      const participantIds = [teacherId, studentId]
      participantIds.forEach(participantId => {
        globalSocketIO?.to(`user:${participantId}`).emit("conversation:new", {
          conversation: formattedConversation,
          participantIds
        })
      })
    }

    revalidatePath("/teacher/discussions")
    return { success: true, data: formattedConversation }
  } catch (error) {
    console.error("Error creating private conversation:", error)
    return { success: false, error: "Failed to create private conversation" }
  }
}

// API route helper to get Socket.IO instance
export async function getSocketIOInstance() {
  return globalSocketIO
}

// Initialize Socket.IO from API route
export async function initializeSocketFromAPI(req: any, res: NextApiResponseServerIO) {
  try {
    if (!res.socket.server.io) {
      // Initialize Socket.IO server
      const { initializeSocketServer } = await import("@/app/lib/socket.server")
      const io = initializeSocketServer(res)
      globalSocketIO = io
    } else {
      globalSocketIO = res.socket.server.io
    }
    
    return { success: true, io: globalSocketIO }
  } catch (error) {
    console.error("Error initializing Socket.IO:", error)
    return { success: false, error: "Failed to initialize Socket.IO" }
  }
}