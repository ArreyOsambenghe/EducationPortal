"use server"

import prisma from "@/app/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Types
export type Exam = {
  id: string
  title: string
  course: string
  courseCode: string
  date: string
  time: string
  duration: number
  room: string
  totalMarks: number
  passingMarks: number
  instructions: string[]
  questions: Question[]
  status: "draft" | "scheduled" | "active" | "completed" | "graded"
  studentsEnrolled: number
  studentsCompleted: number
  averageScore?: number
}

export type Question = {
  id: string
  type: "multiple-choice" | "short-answer" | "essay" | "true-false"
  question: string
  options?: string[]
  correctAnswer?: string | number
  points: number
  difficulty: "easy" | "medium" | "hard"
}

// Validation schemas
const questionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["multiple-choice", "short-answer", "essay", "true-false"]),
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.number()]).optional(),
  points: z.number().min(1, "Points must be at least 1"),
  difficulty: z.enum(["easy", "medium", "hard"])
})

const examSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  course: z.string().min(1, "Course is required"),
  courseCode: z.string().min(1, "Course code is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  room: z.string().min(1, "Room is required"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  passingMarks: z.number().min(1, "Passing marks must be at least 1"),
  instructions: z.array(z.string()),
  status: z.enum(["draft", "scheduled", "active", "completed", "graded"]),
  semesterCourseId: z.string().min(1, "Semester course ID is required")
})

const gradeSubmissionSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  grade: z.number().min(0, "Grade cannot be negative"),
  feedback: z.string().optional(),
  answers: z.array(z.object({
    id: z.string(),
    pointsEarned: z.number().min(0, "Points cannot be negative"),
    isCorrect: z.boolean().optional()
  }))
})

// Helper functions
async function mapDbExamToExam(dbExam: any): Promise<Exam> {
  // Get enrolled students count
  const enrolledCount = await prisma.studentEnrollment.count({
    where: { semesterCourseId: dbExam.semesterCourseId }
  })
  
  // Get completed submissions count
  const completedCount = await prisma.examSubmission.count({
    where: { examId: dbExam.id }
  })
  
  // Calculate average score if exam is completed or graded
  let averageScore = undefined
  if (dbExam.status === "COMPLETED" || dbExam.status === "GRADED") {
    const submissions = await prisma.examSubmission.findMany({
      where: { examId: dbExam.id, grade: { not: null } }
    })
    
    if (submissions.length > 0) {
      const totalScore = submissions.reduce((sum, sub) => sum + (sub.grade || 0), 0)
      averageScore = Math.round(totalScore / submissions.length)
    }
  }
  
  // Get questions
  const questions = await prisma.examQuestion.findMany({
    where: { examId: dbExam.id },
    orderBy: { order: 'asc' }
  })
  
  // Map to our frontend model
  return {
    id: dbExam.id,
    title: dbExam.title,
    course: dbExam.semesterCourse.course.name,
    courseCode: dbExam.semesterCourse.course.code,
    date: dbExam.examDate.toISOString().split('T')[0],
    time: dbExam.examDate.toISOString().split('T')[1].substring(0, 5),
    duration: dbExam.duration,
    room: dbExam.semesterCourse.room,
    totalMarks: dbExam.totalPoints,
    passingMarks: Math.round(dbExam.totalPoints * 0.6), // Assuming 60% is passing
    instructions: dbExam.instructions ? dbExam.instructions.split('\n') : [],
    questions: questions.map(q => ({
      id: q.id,
      type: q.type.toLowerCase() as any,
      question: q.question,
      options: q.options as string[],
      correctAnswer: q.correctAnswer as any,
      points: q.points,
      difficulty: "medium" // Default if not available in DB
    })),
    status: dbExam.status.toLowerCase() as any,
    studentsEnrolled: enrolledCount,
    studentsCompleted: completedCount,
    averageScore
  }
}

// CRUD Actions
export async function getExams() {
  try {
    const dbExams = await prisma.courseExam.findMany({
      include: {
        semesterCourse: {
          include: {
            course: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    const exams = await Promise.all(dbExams.map(mapDbExamToExam))
    return { success: true, data: exams }
  } catch (error) {
    console.error("Failed to fetch exams:", error)
    return { success: false, error: "Failed to fetch exams" }
  }
}

export async function getExamById(id: string) {
  try {
    const dbExam = await prisma.courseExam.findUnique({
      where: { id },
      include: {
        semesterCourse: {
          include: {
            course: true
          }
        }
      }
    })
    
    if (!dbExam) {
      return { success: false, error: "Exam not found" }
    }
    
    const exam = await mapDbExamToExam(dbExam)
    return { success: true, data: exam }
  } catch (error) {
    console.error(`Failed to fetch exam ${id}:`, error)
    return { success: false, error: "Failed to fetch exam" }
  }
}

export async function createExam(examData: z.infer<typeof examSchema>) {
  try {
    const validatedData = examSchema.parse(examData)
    
    // Convert date and time to DateTime
    const examDate = new Date(`${validatedData.date}T${validatedData.time}`)
    
    const newExam = await prisma.courseExam.create({
      data: {
        title: validatedData.title,
        description: validatedData.course, // Using course as description
        examDate,
        duration: validatedData.duration,
        totalPoints: validatedData.totalMarks,
        status: validatedData.status.toUpperCase() as any,
        instructions: validatedData.instructions.join('\n'),
        semesterCourseId: validatedData.semesterCourseId,
        
      }
    })
    
    revalidatePath('/exams')
    return { success: true, data: newExam }
  } catch (error) {
    console.error("Failed to create exam:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: "Failed to create exam" }
  }
}

export async function updateExam(examData: z.infer<typeof examSchema>) {
  try {
    const validatedData = examSchema.parse(examData)
    
    if (!validatedData.id) {
      return { success: false, error: "Exam ID is required" }
    }
    
    // Convert date and time to DateTime
    const examDate = new Date(`${validatedData.date}T${validatedData.time}`)
    
    const updatedExam = await prisma.courseExam.update({
      where: { id: validatedData.id },
      data: {
        title: validatedData.title,
        description: validatedData.course, // Using course as description
        examDate,
        duration: validatedData.duration,
        totalPoints: validatedData.totalMarks,
        status: validatedData.status.toUpperCase() as any,
        instructions: validatedData.instructions.join('\n')
      }
    })
    
    revalidatePath('/exams')
    return { success: true, data: updatedExam }
  } catch (error) {
    console.error("Failed to update exam:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: "Failed to update exam" }
  }
}

export async function deleteExam(id: string) {
  try {
    await prisma.courseExam.delete({
      where: { id }
    })
    
    revalidatePath('/exams')
    return { success: true }
  } catch (error) {
    console.error(`Failed to delete exam ${id}:`, error)
    return { success: false, error: "Failed to delete exam" }
  }
}

// Question Management
export async function addQuestion(examId: string, questionData: z.infer<typeof questionSchema>) {
  try {
    const validatedData = questionSchema.parse(questionData)
    
    // Get the current highest order
    const highestOrder = await prisma.examQuestion.findFirst({
      where: { examId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })
    
    const newOrder = (highestOrder?.order || 0) + 1
    
    const newQuestion = await prisma.examQuestion.create({
      data: {
        examId,
        question: validatedData.question,
        type: validatedData.type.toUpperCase() as any,
        options: validatedData.options || [],
        correctAnswer: validatedData.correctAnswer?.toString() || null,
        points: validatedData.points,
        order: newOrder
      }
    })
    
    revalidatePath('/exams')
    return { success: true, data: newQuestion }
  } catch (error) {
    console.error("Failed to add question:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: "Failed to add question" }
  }
}

export async function updateQuestion(questionData: z.infer<typeof questionSchema> & { id: string }) {
  try {
    const validatedData = questionSchema.parse(questionData)
    
    const updatedQuestion = await prisma.examQuestion.update({
      where: { id: questionData.id },
      data: {
        question: validatedData.question,
        type: validatedData.type.toUpperCase() as any,
        options: validatedData.options || [],
        correctAnswer: validatedData.correctAnswer?.toString() || null,
        points: validatedData.points
      }
    })
    
    revalidatePath('/exams')
    return { success: true, data: updatedQuestion }
  } catch (error) {
    console.error("Failed to update question:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: "Failed to update question" }
  }
}

export async function deleteQuestion(id: string) {
  try {
    await prisma.examQuestion.delete({
      where: { id }
    })
    
    revalidatePath('/exams')
    return { success: true }
  } catch (error) {
    console.error(`Failed to delete question ${id}:`, error)
    return { success: false, error: "Failed to delete question" }
  }
}

// Exam Submission and Grading
export async function getExamSubmissions(examId: string) {
  try {
    const submissions = await prisma.examSubmission.findMany({
      where: { examId },
      include: {
        student: true,
        answers: {
          include: {
            question: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })
    
    return { success: true, data: submissions }
  } catch (error) {
    console.error(`Failed to fetch submissions for exam ${examId}:`, error)
    return { success: false, error: "Failed to fetch submissions" }
  }
}

export async function gradeSubmission(data: z.infer<typeof gradeSubmissionSchema>) {
  try {
    const validatedData = gradeSubmissionSchema.parse(data)
    
    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update each answer
      for (const answer of validatedData.answers) {
        await tx.examAnswer.update({
          where: { id: answer.id },
          data: {
            isCorrect: answer.isCorrect,
            pointsEarned: answer.pointsEarned
          }
        })
      }
      
      // Update the submission
      const updatedSubmission = await tx.examSubmission.update({
        where: { id: validatedData.submissionId },
        data: {
          grade: validatedData.grade,
          feedback: validatedData.feedback,
          status: "GRADED",
          gradedAt: new Date()
        }
      })
      
      return updatedSubmission
    })
    
    revalidatePath('/exams')
    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to grade submission:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: "Failed to grade submission" }
  }
}

// Analytics
export async function getExamAnalytics(examId: string) {
  try {
    // Get the exam
    const exam = await prisma.courseExam.findUnique({
      where: { id: examId }
    })
    
    if (!exam) {
      return { success: false, error: "Exam not found" }
    }
    
    // Get all submissions
    const submissions = await prisma.examSubmission.findMany({
      where: { examId },
      include: {
        answers: {
          include: {
            question: true
          }
        }
      }
    })
    
    // Get all questions
    const questions = await prisma.examQuestion.findMany({
      where: { examId },
      orderBy: { order: 'asc' }
    })
    
    // Calculate statistics
    const totalSubmissions = submissions.length
    const gradedSubmissions = submissions.filter(s => s.grade !== null).length
    
    let averageScore = 0
    if (gradedSubmissions > 0) {
      const totalScore = submissions.reduce((sum, sub) => sum + (sub.grade || 0), 0)
      averageScore = totalScore / gradedSubmissions
    }
    
    // Calculate pass rate
    const passingGrade = Math.round(exam.totalPoints * 0.6) // Assuming 60% is passing
    const passedCount = submissions.filter(s => (s.grade || 0) >= passingGrade).length
    const passRate = totalSubmissions > 0 ? (passedCount / totalSubmissions) * 100 : 0
    
    // Calculate question statistics
    const questionStats = questions.map(q => {
      const answers = submissions.flatMap(s => s.answers.filter(a => a.questionId === q.id))
      const correctCount = answers.filter(a => a.isCorrect).length
      const correctRate = answers.length > 0 ? (correctCount / answers.length) * 100 : 0
      
      return {
        id: q.id,
        question: q.question,
        correctRate,
        averagePoints: answers.length > 0 
          ? answers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0) / answers.length 
          : 0,
        totalPoints: q.points
      }
    })
    
    // Calculate grade distribution
    const gradeRanges = [
      { min: 90, max: 100, label: 'A' },
      { min: 80, max: 89, label: 'B' },
      { min: 70, max: 79, label: 'C' },
      { min: 60, max: 69, label: 'D' },
      { min: 0, max: 59, label: 'F' }
    ]
    
    const gradeDistribution = gradeRanges.map(range => {
      const count = submissions.filter(s => {
        const percentage = s.grade ? (s.grade / exam.totalPoints) * 100 : 0
        return percentage >= range.min && percentage <= range.max
      }).length
      
      return {
        label: range.label,
        count,
        percentage: totalSubmissions > 0 ? (count / totalSubmissions) * 100 : 0
      }
    })
    
    return { 
      success: true, 
      data: {
        totalSubmissions,
        gradedSubmissions,
        averageScore,
        passRate,
        questionStats,
        gradeDistribution
      }
    }
  } catch (error) {
    console.error(`Failed to get analytics for exam ${examId}:`, error)
    return { success: false, error: "Failed to get exam analytics" }
  }
}
