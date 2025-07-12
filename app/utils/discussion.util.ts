// discussion-utils.ts
"use server"

import  prisma  from "@/app/lib/prisma"
import { createCourseDiscussionGroup, addStudentToDiscussionGroup } from "@/app/actions/teacher/discussion.action"

// Call this when a course status changes to ACTIVE
export async function activateCourseDiscussions(semesterCourseId: string) {
  try {
    // Create discussion group for the course
    const result = await createCourseDiscussionGroup(semesterCourseId)
    
    if (!result.success) {
      throw new Error(result.error)
    }

    // Get all enrolled students for this course (you'll need to implement this based on your enrollment system)
    const enrolledStudents = await getEnrolledStudents(semesterCourseId)
    
    // Add all enrolled students to the discussion group
    for (const studentId of enrolledStudents) {
      await addStudentToDiscussionGroup(semesterCourseId, studentId)
    }

    return { success: true, message: "Course discussions activated successfully" }
  } catch (error) {
    console.error("Error activating course discussions:", error)
    return { success: false, error: "Failed to activate course discussions" }
  }
}

// Call this when a student enrolls in a course
export async function enrollStudentInCourseDiscussion(semesterCourseId: string, studentId: string) {
  try {
    // Check if the course has an active discussion group
    const discussionGroup = await prisma.discussionGroup.findUnique({
      where: { semesterCourseId }
    })

    if (!discussionGroup) {
      // If no discussion group exists, create one first
      await createCourseDiscussionGroup(semesterCourseId)
    }

    // Add student to the discussion group
    const result = await addStudentToDiscussionGroup(semesterCourseId, studentId)
    
    return result
  } catch (error) {
    console.error("Error enrolling student in course discussion:", error)
    return { success: false, error: "Failed to enroll student in course discussion" }
  }
}

// Helper function to get enrolled students - implement based on your enrollment system
async function getEnrolledStudents(semesterCourseId: string): Promise<string[]> {
  try {
    // This is a placeholder - you'll need to implement this based on your enrollment system
    // For example, if you have an Enrollment model:
    
    /*
    const enrollments = await prisma.enrollment.findMany({
      where: {
        semesterCourseId,
        status: "ACTIVE"
      },
      select: {
        studentId: true
      }
    })
    
    return enrollments.map(enrollment => enrollment.studentId)
    */
    
    // For now, return empty array - replace with your actual implementation
    return []
  } catch (error) {
    console.error("Error getting enrolled students:", error)
    return []
  }
}

// Function to handle course status changes
export async function handleCourseStatusChange(semesterCourseId: string, newStatus: string) {
  try {
    if (newStatus === "ACTIVE") {
      await activateCourseDiscussions(semesterCourseId)
    } else if (newStatus === "COMPLETED" || newStatus === "DRAFT") {
      // Optionally deactivate discussions or archive them
      await deactivateCourseDiscussions(semesterCourseId)
    }
    
    return { success: true }
  } catch (error) {
    console.error("Error handling course status change:", error)
    return { success: false, error: "Failed to handle course status change" }
  }
}

// Deactivate course discussions
export async function deactivateCourseDiscussions(semesterCourseId: string) {
  try {
    await prisma.discussionGroup.update({
      where: { semesterCourseId },
      data: { isActive: false }
    })

    // Also deactivate the group conversation
    await prisma.conversation.updateMany({
      where: {
        group: {
          semesterCourseId
        }
      },
      data: { isActive: false }
    })

    return { success: true }
  } catch (error) {
    console.error("Error deactivating course discussions:", error)
    return { success: false, error: "Failed to deactivate course discussions" }
  }
}

// Get discussion statistics for a course
export async function getCourseDiscussionStats(semesterCourseId: string) {
  try {
    const discussionGroup = await prisma.discussionGroup.findUnique({
      where: { semesterCourseId },
      include: {
        conversations: {
          include: {
            _count: {
              select: {
                messages: true
              }
            }
          }
        },
        memberships: {
          where: { isActive: true }
        }
      }
    })

    if (!discussionGroup) {
      return { success: true, data: null }
    }

    const stats = {
      totalMembers: discussionGroup.memberships.length,
      totalConversations: discussionGroup.conversations.length,
      totalMessages: discussionGroup.conversations.reduce(
        (sum, conv) => sum + conv._count.messages, 0
      ),
      isActive: discussionGroup.isActive
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error("Error getting course discussion stats:", error)
    return { success: false, error: "Failed to get course discussion stats" }
  }
}

// Remove student from course discussion when they unenroll
export async function removeStudentFromCourseDiscussion(semesterCourseId: string, studentId: string) {
  try {
    const discussionGroup = await prisma.discussionGroup.findUnique({
      where: { semesterCourseId }
    })

    if (!discussionGroup) {
      return { success: true, message: "No discussion group found" }
    }

    // Deactivate student's membership
    await prisma.discussionGroupMembership.updateMany({
      where: {
        groupId: discussionGroup.id,
        studentId
      },
      data: { isActive: false }
    })

    // Also remove from private conversations with the teacher
    await prisma.conversationParticipant.updateMany({
      where: {
        studentId,
        conversation: {
          type: "PRIVATE",
          participants: {
            some: {
              teacher: {
                semesterCourse: {
                  some: {
                    id: semesterCourseId
                  }
                }
              }
            }
          }
        }
      },
      data: { isActive: false }
    })

    return { success: true }
  } catch (error) {
    console.error("Error removing student from course discussion:", error)
    return { success: false, error: "Failed to remove student from course discussion" }
  }
}

// Bulk operations for managing discussions
export async function bulkAddStudentsToDiscussion(semesterCourseId: string, studentIds: string[]) {
  try {
    const results = await Promise.allSettled(
      studentIds.map(studentId => 
        addStudentToDiscussionGroup(semesterCourseId, studentId)
      )
    )

    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length

    return { 
      success: true, 
      data: { 
        total: studentIds.length, 
        successful, 
        failed: studentIds.length - successful 
      } 
    }
  } catch (error) {
    console.error("Error bulk adding students to discussion:", error)
    return { success: false, error: "Failed to bulk add students to discussion" }
  }
}

// Get active discussion groups for a teacher
export async function getTeacherDiscussionGroups(teacherId: string) {
  try {
    const groups = await prisma.discussionGroup.findMany({
      where: {
        memberships: {
          some: {
            teacherId,
            isActive: true
          }
        },
        isActive: true
      },
      include: {
        semesterCourse: {
          include: {
            course: true
          }
        },
        memberships: {
          where: { isActive: true },
          include: {
            student: true,
            teacher: true
          }
        },
        conversations: {
          include: {
            _count: {
              select: {
                messages: {
                  where: {
                    readReceipts: {
                      none: {
                        readerTeacherId: teacherId
                      }
                    },
                    senderTeacherId: {
                      not: teacherId
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    return { success: true, data: groups }
  } catch (error) {
    console.error("Error getting teacher discussion groups:", error)
    return { success: false, error: "Failed to get teacher discussion groups" }
  }
}