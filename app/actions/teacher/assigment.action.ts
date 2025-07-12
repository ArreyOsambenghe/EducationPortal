"use server"

import prisma from "@/app/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Validation schemas
const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  course: z.string().min(1, "Course is required"),
  courseCode: z.string().min(1, "Course code is required"),
  dueDate: z.string().min(1, "Due date is required"),
  dueTime: z.string().min(1, "Due time is required"),
  totalPoints: z.number().min(1, "Total points must be at least 1"),
  instructions: z.array(z.string()).min(1, "At least one instruction is required"),
  allowLateSubmissions: z.boolean(),
  semesterCourseId: z.string().min(1, "Semester course ID is required"),
})

const gradeSubmissionSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  grade: z.number().min(0, "Grade cannot be negative"),
  feedback: z.string().optional(),
  gradedBy: z.string().min(1, "Grader ID is required"),
})

// Types
export type Assignment = {
  id: string
  title: string
  description: string
  course: string
  courseCode: string
  dueDate: string
  dueTime: string
  totalPoints: number
  instructions: string[]
  attachments: string[]
  submissions: Submission[]
  status: "draft" | "published" | "closed"
  allowLateSubmissions: boolean
  createdAt: string
}

export type Submission = {
  id: string
  studentId: string
  studentName: string
  submittedAt: string
  files: string[]
  grade?: number
  feedback?: string
  status: "submitted" | "graded" | "late"
}

// Assignment CRUD Operations
export async function createAssignment(data: z.infer<typeof createAssignmentSchema>) {
  try {
    const validatedData = createAssignmentSchema.parse(data)

    const assignment = await prisma.courseAssignment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        dueDate: new Date(validatedData.dueDate + "T" + validatedData.dueTime),
        totalPoints: validatedData.totalPoints,
        status: "DRAFT",
        semesterCourseId: validatedData.semesterCourseId,
        files: [],
      },
      include: {
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            files: {
              include: {
                file: true,
              },
            },
          },
        },
        semesterCourse: {
          include: {
            course: true,
          },
        },
      },
    })

    revalidatePath("/teacher/assignments")
    return { success: true, assignment: transformAssignment(assignment) }
  } catch (error) {
    console.error("Error creating assignment:", error)
    return { success: false, error: "Failed to create assignment" }
  }
}

export async function getAssignments(
  teacherId: string,
  filters?: {
    search?: string
    status?: string
  },
) {
  try {
    const where: any = {
      semesterCourse: {
        instructorId: teacherId,
      },
    }

    if (filters?.status && filters.status !== "all") {
      where.status = filters.status.toUpperCase()
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { course: { contains: filters.search, mode: "insensitive" } },
        { courseCode: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    const assignments = await prisma.courseAssignment.findMany({
      where,
      include: {
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            files: {
              include: {
                file: true,
              },
            },
          },
        },
        semesterCourse: {
          include: {
            course: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, assignments: assignments.map(transformAssignment) }
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return { success: false, error: "Failed to fetch assignments" }
  }
}

export async function getAssignmentById(assignmentId: string) {
  try {
    const assignment = await prisma.courseAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            files: {
              include: {
                file: true,
              },
            },
          },
        },
        semesterCourse: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!assignment) {
      return { success: false, error: "Assignment not found" }
    }

    return { success: true, assignment: transformAssignment(assignment) }
  } catch (error) {
    console.error("Error fetching assignment:", error)
    return { success: false, error: "Failed to fetch assignment" }
  }
}

export async function updateAssignment(assignmentId: string, data: Partial<z.infer<typeof createAssignmentSchema>>) {
  try {
    const updateData: any = {}

    if (data.title) updateData.title = data.title
    if (data.description) updateData.description = data.description
    if (data.course) updateData.course = data.course
    if (data.courseCode) updateData.courseCode = data.courseCode
    if (data.dueDate && data.dueTime) {
      updateData.dueDate = new Date(data.dueDate + "T" + data.dueTime)
      updateData.dueTime = data.dueTime
    }
    if (data.totalPoints) updateData.totalPoints = data.totalPoints
    if (data.instructions) updateData.instructions = data.instructions
    if (data.allowLateSubmissions !== undefined) updateData.allowLateSubmissions = data.allowLateSubmissions

    const assignment = await prisma.courseAssignment.update({
      where: { id: assignmentId },
      data: updateData,
      include: {
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            files: {
              include: {
                file: true,
              },
            },
          },
        },
        semesterCourse: {
          include: {
            course: true,
          },
        },
      },
    })

    revalidatePath("/teacher/assignments")
    return { success: true, assignment: transformAssignment(assignment) }
  } catch (error) {
    console.error("Error updating assignment:", error)
    return { success: false, error: "Failed to update assignment" }
  }
}

export async function deleteAssignment(assignmentId: string) {
  try {
    await prisma.courseAssignment.delete({
      where: { id: assignmentId },
    })

    revalidatePath("/teacher/assignments")
    return { success: true }
  } catch (error) {
    console.error("Error deleting assignment:", error)
    return { success: false, error: "Failed to delete assignment" }
  }
}

export async function updateAssignmentStatus(assignmentId: string, status: "DRAFT" | "ACTIVE" | "CLOSED") {
  try {
    const assignment = await prisma.courseAssignment.update({
      where: { id: assignmentId },
      data: { status },
      include: {
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            files: {
              include: {
                file: true,
              },
            },
          },
        },
        semesterCourse: {
          include: {
            course: true,
          },
        },
      },
    })

    revalidatePath("/teacher/assignments")
    return { success: true, assignment: transformAssignment(assignment) }
  } catch (error) {
    console.error("Error updating assignment status:", error)
    return { success: false, error: "Failed to update assignment status" }
  }
}

// Submission Operations
export async function gradeSubmission(data: z.infer<typeof gradeSubmissionSchema>) {
  try {
    const validatedData = gradeSubmissionSchema.parse(data)

    const submission = await prisma.assignmentSubmission.update({
      where: { id: validatedData.submissionId },
      data: {
        grade: validatedData.grade,
        feedback: validatedData.feedback,
        status: "GRADED",
        gradedAt: new Date(),
        gradedBy: validatedData.gradedBy,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        files: {
          include: {
            file: true,
          },
        },
      },
    })

    revalidatePath("/teacher/assignments")
    return { success: true, submission: transformSubmission(submission) }
  } catch (error) {
    console.error("Error grading submission:", error)
    return { success: false, error: "Failed to grade submission" }
  }
}

export async function getSubmissionsByAssignment(assignmentId: string) {
  try {
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        files: {
          include: {
            file: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    })

    return { success: true, submissions: submissions.map(transformSubmission) }
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return { success: false, error: "Failed to fetch submissions" }
  }
}

// Statistics
export async function getAssignmentStats(teacherId: string) {
  try {
    const totalAssignments = await prisma.courseAssignment.count({
      where: {
        semesterCourse: {
          instructorId: teacherId,
        },
      },
    })

    const publishedAssignments = await prisma.courseAssignment.count({
      where: {
        semesterCourse: {
          instructorId: teacherId,
        },
        status: "ACTIVE",
      },
    })

    const pendingGrading = await prisma.assignmentSubmission.count({
      where: {
        assignment: {
          semesterCourse: {
            instructorId: teacherId,
          },
        },
        status: "SUBMITTED",
      },
    })

    const totalSubmissions = await prisma.assignmentSubmission.count({
      where: {
        assignment: {
          semesterCourse: {
            instructorId: teacherId,
          },
        },
      },
    })

    return {
      success: true,
      stats: {
        totalAssignments,
        publishedAssignments,
        pendingGrading,
        totalSubmissions,
      },
    }
  } catch (error) {
    console.error("Error fetching assignment stats:", error)
    return { success: false, error: "Failed to fetch assignment stats" }
  }
}

// Helper function to transform database assignment to component format
function transformAssignment(assignment: any): Assignment {
  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    course: assignment.course || assignment.semesterCourse?.course?.name || "",
    courseCode: assignment.courseCode || assignment.semesterCourse?.course?.code || "",
    dueDate: assignment.dueDate.toISOString().split("T")[0],
    dueTime: assignment.dueTime || assignment.dueDate.toTimeString().slice(0, 5),
    totalPoints: assignment.totalPoints,
    instructions: assignment.instructions || [],
    attachments: assignment.files || [],
    submissions: assignment.submissions?.map(transformSubmission) || [],
    status: assignment.status.toLowerCase() as "draft" | "published" | "closed",
    allowLateSubmissions: assignment.allowLateSubmissions ?? true,
    createdAt: assignment.createdAt.toISOString().split("T")[0],
  }
}

function transformSubmission(submission: any): Submission {
  const isLate = submission.submittedAt > submission.assignment?.dueDate

  return {
    id: submission.id,
    studentId: submission.studentId,
    studentName: `${submission.student.firstName} ${submission.student.lastName}`,
    submittedAt: submission.submittedAt.toLocaleString(),
    files: submission.files?.map((f: any) => f.file.fileName) || [],
    grade: submission.grade,
    feedback: submission.feedback,
    status: (submission.status.toLowerCase() as "submitted" | "graded" | "late") || (isLate ? "late" : "submitted"),
  }
}
