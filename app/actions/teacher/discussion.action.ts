"use server"

import { revalidatePath } from "next/cache"
import  prisma  from "@/app/lib/prisma" // Adjust path to your Prisma instance

// Types
type User = {
  id: string
  name: string
  email: string
  avatar?: string
  role: "teacher" | "student"
  lastSeen?: string
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
  participants: User[]
  lastMessage?: Message
  unreadCount: number
  createdAt: string
  updatedAt: string
}

type ConversationCreate = {
  type: "private" | "group"
  title: string
  courseId?: string
  participantIds: string[]
}

type MessageCreate = {
  conversationId: string
  senderId: string
  senderName: string
  senderRole: "teacher" | "student"
  content: string
  attachments?: Attachment[]
}

// Helper function to format user data
function formatUser(user: any, role: "teacher" | "student"): User {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: role,
    lastSeen: user.updatedAt?.toISOString(),
  }
}

// Helper function to format message data
function formatMessage(message: any): Message {
  const sender = message.senderTeacher || message.senderStudent
  const senderRole = message.senderTeacher ? "teacher" : "student"
  
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: sender.id,
    senderName: `${sender.firstName} ${sender.lastName}`,
    senderRole: senderRole,
    content: message.content,
    timestamp: message.createdAt.toISOString(),
    attachments: message.attachments?.map((att: any) => ({
      id: att.id,
      name: att.name,
      url: att.file.fileUrl,
      type: att.type,
      size: att.size,
    })) || [],
    readBy: message.readReceipts?.map((receipt: any) => 
      receipt.readerTeacher?.id || receipt.readerStudent?.id
    ) || [],
    edited: message.isEdited,
    editedAt: message.editedAt?.toISOString(),
  }
}

// Create discussion group when course becomes active
export async function createCourseDiscussionGroup(semesterCourseId: string) {
  try {
    const semesterCourse = await prisma.semesterCourse.findUnique({
      where: { id: semesterCourseId },
      include: {
        course: true,
        instructor: true,
      }
    })

    if (!semesterCourse) {
      throw new Error("Semester course not found")
    }

    // Check if group already exists
    const existingGroup = await prisma.discussionGroup.findUnique({
      where: { semesterCourseId }
    })

    if (existingGroup) {
      return { success: true, data: existingGroup }
    }

    // Create discussion group
    const discussionGroup = await prisma.discussionGroup.create({
      data: {
        name: `${semesterCourse.course.name} Discussion`,
        description: `Discussion group for ${semesterCourse.course.name}`,
        type: "COURSE_GROUP",
        semesterCourseId,
      }
    })

    // Add teacher to the group
    await prisma.discussionGroupMembership.create({
      data: {
        groupId: discussionGroup.id,
        teacherId: semesterCourse.instructorId,
        role: "ADMIN",
      }
    })

    // Create group conversation
    await prisma.conversation.create({
      data: {
        title: `${semesterCourse.course.name} Group Chat`,
        type: "GROUP",
        groupId: discussionGroup.id,
      }
    })

    return { success: true, data: discussionGroup }
  } catch (error) {
    console.error("Error creating discussion group:", error)
    return { success: false, error: "Failed to create discussion group" }
  }
}

// Add student to course discussion group when they enroll
export async function addStudentToDiscussionGroup(semesterCourseId: string, studentId: string) {
  try {
    const discussionGroup = await prisma.discussionGroup.findUnique({
      where: { semesterCourseId }
    })

    if (!discussionGroup) {
      throw new Error("Discussion group not found")
    }

    // Add student to group
    await prisma.discussionGroupMembership.create({
      data: {
        groupId: discussionGroup.id,
        studentId,
        role: "MEMBER",
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error adding student to discussion group:", error)
    return { success: false, error: "Failed to add student to discussion group" }
  }
}

// Get conversations for a teacher
export async function getConversations(teacherId: string) {
  try {
    // Get group conversations (course-based)
    const groupConversations = await prisma.conversation.findMany({
      where: {
        type: "GROUP",
        group: {
          memberships: {
            some: {
              teacherId,
              isActive: true,
            }
          }
        }
      },
      include: {
        group: {
          include: {
            semesterCourse: {
              include: {
                course: true,
              }
            },
            memberships: {
              include: {
                teacher: true,
                student: true,
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
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
        },
        _count: {
          select: {
            messages: {
              where: {
                readReceipts: {
                  none: {
                    readerTeacherId: teacherId,
                  }
                },
                senderTeacherId: {
                  not: teacherId,
                }
              }
            }
          }
        }
      }
    })

    // Get private conversations
    const privateConversations = await prisma.conversation.findMany({
      where: {
        type: "PRIVATE",
        participants: {
          some: {
            teacherId,
            isActive: true,
          }
        }
      },
      include: {
        participants: {
          include: {
            teacher: true,
            student: true,
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
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
        },
        _count: {
          select: {
            messages: {
              where: {
                readReceipts: {
                  none: {
                    readerTeacherId: teacherId,
                  }
                },
                senderTeacherId: {
                  not: teacherId,
                }
              }
            }
          }
        }
      }
    })

    // Format conversations
    const formattedConversations: Conversation[] = [
      ...groupConversations.map(conv => ({
        id: conv.id,
        type: "group" as const,
        title: conv.title,
        courseId: conv.group?.semesterCourse.id,
        courseName: conv.group?.semesterCourse.course.name,
        participants: conv.group?.memberships.map(member => 
          formatUser(
            member.teacher || member.student,
            member.teacher ? "teacher" : "student"
          )
        ) || [],
        lastMessage: conv.messages[0] ? formatMessage(conv.messages[0]) : undefined,
        unreadCount: conv._count.messages,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
      })),
      ...privateConversations.map(conv => ({
        id: conv.id,
        type: "private" as const,
        title: conv.title,
        participants: conv.participants.map(participant => 
          formatUser(
            participant.teacher || participant.student,
            participant.teacher ? "teacher" : "student"
          )
        ),
        lastMessage: conv.messages[0] ? formatMessage(conv.messages[0]) : undefined,
        unreadCount: conv._count.messages,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
      }))
    ]

    return { success: true, data: formattedConversations }
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return { success: false, error: "Failed to fetch conversations" }
  }
}

// Get messages for a conversation
export async function getMessages(conversationId: string) {
  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
      },
      orderBy: { createdAt: "asc" },
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

    const formattedMessages = messages.map(formatMessage)

    return { success: true, data: formattedMessages }
  } catch (error) {
    console.error("Error fetching messages:", error)
    return { success: false, error: "Failed to fetch messages" }
  }
}

// Send message
export async function sendMessage(messageData: MessageCreate) {
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
            fileId: att.id, // Assuming attachment ID is the file ID
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

    revalidatePath("/teacher/discussions")

    return { success: true, data: formatMessage(message) }
  } catch (error) {
    console.error("Error sending message:", error)
    return { success: false, error: "Failed to send message" }
  }
}

// Create private conversation
export async function createPrivateConversation(teacherId: string, studentId: string) {
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
      }
    })

    if (existingConversation) {
      return { success: true, data: existingConversation }
    }

    // Get student info for conversation title
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      throw new Error("Student not found")
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
      }
    })

    revalidatePath("/teacher/discussions")

    return { success: true, data: conversation }
  } catch (error) {
    console.error("Error creating private conversation:", error)
    return { success: false, error: "Failed to create private conversation" }
  }
}

// Mark messages as read
export async function markAsRead(conversationId: string, userId: string, userRole: "teacher" | "student") {
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

    await prisma.messageReadReceipt.createMany({
      data: messages.map(message => ({
        messageId: message.id,
        readerTeacherId: userRole === "teacher" ? userId : null,
        readerStudentId: userRole === "student" ? userId : null,
      }))
    })

    revalidatePath("/teacher/discussions")

    return { success: true }
  } catch (error) {
    console.error("Error marking as read:", error)
    return { success: false, error: "Failed to mark as read" }
  }
}

// Get course participants (students)
export async function getCourseParticipants(semesterCourseId: string) {
  try {
    const discussionGroup = await prisma.discussionGroup.findUnique({
      where: { semesterCourseId },
      include: {
        memberships: {
          where: {
            student: {
              isNot: null,
            },
            isActive: true,
          },
          include: {
            student: true,
          }
        }
      }
    })

    if (!discussionGroup) {
      return { success: true, data: [] }
    }

    const participants = discussionGroup.memberships.map(membership => 
      formatUser(membership.student, "student")
    )

    return { success: true, data: participants }
  } catch (error) {
    console.error("Error fetching course participants:", error)
    return { success: false, error: "Failed to fetch course participants" }
  }
}

// Delete message
export async function deleteMessage(messageId: string) {
  try {
    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      }
    })

    revalidatePath("/teacher/discussions")

    return { success: true }
  } catch (error) {
    console.error("Error deleting message:", error)
    return { success: false, error: "Failed to delete message" }
  }
}

// Edit message
export async function editMessage(messageId: string, newContent: string) {
  try {
    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: newContent,
        isEdited: true,
        editedAt: new Date(),
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

    revalidatePath("/teacher/discussions")

    return { success: true, data: formatMessage(message) }
  } catch (error) {
    console.error("Error editing message:", error)
    return { success: false, error: "Failed to edit message" }
  }
}

// Delete conversation
export async function deleteConversation(conversationId: string) {
  try {
    // For group conversations, just remove the teacher from the group
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { group: true }
    })

    if (conversation?.type === "GROUP") {
      // Don't delete group conversations, just mark as inactive
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { isActive: false }
      })
    } else {
      // For private conversations, soft delete
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { isActive: false }
      })
    }

    revalidatePath("/teacher/discussions")

    return { success: true }
  } catch (error) {
    console.error("Error deleting conversation:", error)
    return { success: false, error: "Failed to delete conversation" }
  }
}