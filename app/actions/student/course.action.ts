"use server"

import { revalidatePath } from "next/cache"
import  prisma  from "@/app/lib/prisma" // Adjust path as needed
import { redirect } from "next/navigation"
import { AssignmentSubmission, ExamQuestion, ExamSubmission } from "@/app/generated/prisma"
import { enrollStudentInCourseDiscussion, removeStudentFromCourseDiscussion } from "@/app/utils/discussion.util"

// Enhanced types based on Prisma schema
export type EnhancedCourse = {
  id: string
  name: string
  code: string
  courseInfo: string
  credits: number
  courseExtras?: string
  status: string
  department: {
    id: string
    name: string
    slug: string
    departmentHeadName?: string
    departmentHeadEmail?: string
  }
  semesterCourses: {
    id: string
    semester: string
    schedule: string
    room: string
    enrolledStudents: number
    status: string
    description?: string
    instructor: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }[]
}

export type StudentEnrollment = {
  id: string
  studentId: string
  semesterCourseId: string
  enrollmentDate: Date
  status: string
  grade?: string
  progress?: number
}

export type CourseAssignmentWithSubmissions = {
  id: string
  title: string
  description: string
  dueDate: Date
  totalPoints: number
  files: string[]
  status: string
  semesterCourse: {
    course: {
      name: string
      code: string
    }
  }
  studentSubmissions?: AssignmentSubmission[]
}

export type ExamWithSubmissions = {
  id: string
  title: string
  description: string
  examDate: Date
  duration: number
  totalPoints: number
  status: string
  semesterCourse: {
    course: {
      name: string
      code: string
    }
  }
  questions: ExamQuestion[]
  studentSubmissions?: ExamSubmission[]
}

// Get enrolled courses for a student
export async function getEnrolledCourses(studentId: string) {
  try {
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        studentId,
        status: "active"
      },
      include: {
        semesterCourse: {
          include: {
            course: {
              include: {
                department: true
              }
            },
            instructor: true
          }
        }
      }
    })

    const enrolledCourses = enrollments.map(enrollment => ({
      id: enrollment.semesterCourse.course.id,
      name: enrollment.semesterCourse.course.name,
      code: enrollment.semesterCourse.course.code,
      department: enrollment.semesterCourse.course.department,
      schedule: enrollment.semesterCourse.schedule,
      room: enrollment.semesterCourse.room,
      instructor: enrollment.semesterCourse.instructor,
      courseInfo: enrollment.semesterCourse.course.courseInfo,
      credits: enrollment.semesterCourse.course.credits,
      courseExtras: enrollment.semesterCourse.course.courseExtras,
      status: enrollment.semesterCourse.status,
      enrolledStudents: enrollment.semesterCourse.enrolledStudents,
      isEnrolled: true,
      enrollmentDate: enrollment.enrollmentDate.toISOString(),
      grade: enrollment.grade,
      progress: enrollment.progress,
      semesterCourseId: enrollment.semesterCourse.id
    }))

    return {
      success: true,
      data: enrolledCourses,
    }
  } catch (error) {
    console.error("Error fetching enrolled courses:", error)
    return {
      success: false,
      error: "Failed to fetch enrolled courses",
    }
  }
}

// Get available courses for enrollment
export async function getAvailableCourses(studentId: string) {
  try {
    // Get courses student is not enrolled in
    const enrolledCourseIds = await prisma.studentEnrollment.findMany({
      where: { studentId, status: "active" },
      select: { semesterCourseId: true }
    })

    const enrolledIds = enrolledCourseIds.map(e => e.semesterCourseId)

    const availableCourses = await prisma.semesterCourse.findMany({
      where: {
        id: { notIn: enrolledIds },
        status: "ACTIVE"
      },
      include: {
        course: {
          include: {
            department: true
          }
        },
        instructor: true
      }
    })

    const formattedCourses = availableCourses.map(sc => ({
      id: sc.course.id,
      name: sc.course.name,
      code: sc.course.code,
      department: sc.course.department,
      schedule: sc.schedule,
      room: sc.room,
      instructor: sc.instructor,
      courseInfo: sc.course.courseInfo,
      credits: sc.course.credits,
      courseExtras: sc.course.courseExtras,
      status: sc.status,
      enrolledStudents: sc.enrolledStudents,
      isEnrolled: false,
      semesterCourseId: sc.id
    }))

    return {
      success: true,
      data: formattedCourses,
    }
  } catch (error) {
    console.error("Error fetching available courses:", error)
    return {
      success: false,
      error: "Failed to fetch available courses",
    }
  }
}

// Enroll student in a semester course
export async function enrollInCourse(studentId: string, semesterCourseId: string) {
  try {
    // Check if already enrolled
    const existingEnrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId,
        semesterCourseId,
      }
    })

    if (existingEnrollment) {
      if(existingEnrollment.status == 'active'){
        return {
        success: false,
        error: "Already enrolled in this course"
      }
      }
      else{
        await prisma.studentEnrollment.update({
          where:{id:existingEnrollment.id},
          data:{
            status:'active',
          }
        })
        await enrollStudentInCourseDiscussion(semesterCourseId,studentId)
        revalidatePath("/student/courses")
        return {
        success: true,
        error: "Successfully enrolled in course"
      }
      }
    }
        

    // Create enrollment
   const newStudent = await prisma.studentEnrollment.create({
      data: {
        studentId,
        semesterCourseId,
        enrollmentDate: new Date(),
        status: "active"
      }
    })

    // Update enrolled students count
    await prisma.semesterCourse.update({
      where: { id: semesterCourseId },
      data: {
        enrolledStudents: {
          increment: 1
        }
      }
    })
    await enrollStudentInCourseDiscussion(semesterCourseId,newStudent.id)

    revalidatePath("/student/courses")

    return {
      success: true,
      data: { message: "Successfully enrolled in course" },
    }
  } catch (error) {
    console.error("Error enrolling in course:", error)
    return {
      success: false,
      error: "Failed to enroll in course",
    }
  }
}

// Unenroll student from a semester course
export async function unenrollFromCourse(studentId: string, semesterCourseId: string) {
  try {
    // Update enrollment status
    await prisma.studentEnrollment.updateMany({
      where: {
        studentId,
        semesterCourseId,
        status: "active"
      },
      data: {
        status: "unenrolled"
      }
    })

    // Update enrolled students count
    await prisma.semesterCourse.update({
      where: { id: semesterCourseId },
      data: {
        enrolledStudents: {
          decrement: 1
        }
      }
    })
    removeStudentFromCourseDiscussion(semesterCourseId,studentId)

    revalidatePath("/student/courses")

    return {
      success: true,
      data: { message: "Successfully unenrolled from course" },
    }
  } catch (error) {
    console.error("Error unenrolling from course:", error)
    return {
      success: false,
      error: "Failed to unenroll from course",
    }
  }
}

// Get course assignments
export async function getCourseAssignments(semesterCourseId: string, studentId?: string) {
  try {
    const assignments = await prisma.courseAssignment.findMany({
      where: {
        semesterCourseId,
        status: "ACTIVE"
      },
      include: {
        semesterCourse: {
          include: {
            course: true
          }
        }
      }
    })

    let assignmentsWithSubmissions = assignments

    if (studentId) {
      // Get student submissions for these assignments
      const submissions = await prisma.assignmentSubmission.findMany({
        where: {
          studentId,
          assignmentId: { in: assignments.map(a => a.id) }
        },
        include: {
          files: true
        }
      })

      assignmentsWithSubmissions = assignments.map(assignment => ({
        ...assignment,
        studentSubmissions: submissions.filter(s => s.assignmentId === assignment.id)
      }))
    }

    return {
      success: true,
      data: assignmentsWithSubmissions,
    }
  } catch (error) {
    console.error("Error fetching course assignments:", error)
    return {
      success: false,
      error: "Failed to fetch course assignments",
    }
  }
}

// Get course exams
export async function getCourseExams(semesterCourseId: string, studentId?: string) {
  try {
    const exams = await prisma.courseExam.findMany({
      where: {
        semesterCourseId
      },
      include: {
        semesterCourse: {
          include: {
            course: true
          }
        },
        questions: true
      }
    })

    let examsWithSubmissions = exams

    if (studentId) {
      // Get student submissions for these exams
      const submissions = await prisma.examSubmission.findMany({
        where: {
          studentId,
          examId: { in: exams.map(e => e.id) }
        },
        include: {
          answers: true,
          files: true
        }
      })

      examsWithSubmissions = exams.map(exam => ({
        ...exam,
        studentSubmissions: submissions.filter(s => s.examId === exam.id)
      }))
    }

    return {
      success: true,
      data: examsWithSubmissions,
    }
  } catch (error) {
    console.error("Error fetching course exams:", error)
    return {
      success: false,
      error: "Failed to fetch course exams",
    }
  }
}

// Get course materials
export async function getCourseMaterials(semesterCourseId: string) {
  try {
    const materials = await prisma.courseMaterial.findMany({
      where: {
        semesterCourseId,
        isVisible: true
      },
      include: {
        file: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return {
      success: true,
      data: materials,
    }
  } catch (error) {
    console.error("Error fetching course materials:", error)
    return {
      success: false,
      error: "Failed to fetch course materials",
    }
  }
}

// Get course announcements
export async function getCourseAnnouncements(semesterCourseId: string) {
  try {
    const announcements = await prisma.courseAnnouncement.findMany({
      where: {
        semesterCourseId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return {
      success: true,
      data: announcements,
    }
  } catch (error) {
    console.error("Error fetching course announcements:", error)
    return {
      success: false,
      error: "Failed to fetch course announcements",
    }
  }
}

// Submit assignment with files
export async function submitAssignment(
  assignmentId: string, 
  studentId: string, 
  submissionText?: string,
  fileIds?: string[]
) {
  try {
    // Check if already submitted
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId
      }
    })

    let submission

    if (existingSubmission) {
      // Update existing submission
      submission = await prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          submissionText,
          submittedAt: new Date(),
          status: "SUBMITTED"
        }
      })
    } else {
      // Create new submission
      submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          studentId,
          submissionText,
          submittedAt: new Date(),
          status: "SUBMITTED"
        }
      })
    }

    // Add files if provided
    if (fileIds && fileIds.length > 0) {
      await prisma.assignmentSubmissionFile.createMany({
        data: fileIds.map(fileId => ({
          submissionId: submission.id,
          fileId
        }))
      })
    }

    revalidatePath("/student/courses")

    return {
      success: true,
      data: { message: "Assignment submitted successfully" },
    }
  } catch (error) {
    console.error("Error submitting assignment:", error)
    return {
      success: false,
      error: "Failed to submit assignment",
    }
  }
}

// Submit exam with answers and files
export async function submitExam(
  examId: string,
  studentId: string,
  answers: { questionId: string; answer: string }[],
  fileIds?: string[]
) {
  try {
    // Create exam submission
    const submission = await prisma.examSubmission.create({
      data: {
        examId,
        studentId,
        submittedAt: new Date(),
        status: "SUBMITTED"
      }
    })

    // Create exam answers
    if (answers.length > 0) {
      await prisma.examAnswer.createMany({
        data: answers.map(answer => ({
          submissionId: submission.id,
          questionId: answer.questionId,
          answer: answer.answer
        }))
      })
    }

    // Add files if provided
    if (fileIds && fileIds.length > 0) {
      await prisma.examSubmissionFile.createMany({
        data: fileIds.map(fileId => ({
          submissionId: submission.id,
          fileId
        }))
      })
    }

    revalidatePath("/student/courses")

    return {
      success: true,
      data: { message: "Exam submitted successfully" },
    }
  } catch (error) {
    console.error("Error submitting exam:", error)
    return {
      success: false,
      error: "Failed to submit exam",
    }
  }
}

// Download material
export async function downloadMaterial(materialId: string) {
  try {
    const material = await prisma.courseMaterial.findUnique({
      where: { id: materialId },
      include: { file: true }
    })

    if (!material) {
      return {
        success: false,
        error: "Material not found"
      }
    }

    // Increment download count
    await prisma.courseMaterial.update({
      where: { id: materialId },
      data: {
        downloadCount: {
          increment: 1
        }
      }
    })

    return {
      success: true,
      data: { 
        downloadUrl: material.file?.fileUrl || material.url,
        fileName: material.fileName || material.file?.originalName
      },
    }
  } catch (error) {
    console.error("Error downloading material:", error)
    return {
      success: false,
      error: "Failed to download material",
    }
  }
}

// Get student grades
export async function getStudentGrades(studentId: string, semesterCourseId?: string) {
  try {
    const whereClause: any = {
      studentId,
      status: "graded"
    }

    if (semesterCourseId) {
      whereClause.assignment = {
        semesterCourseId
      }
    }

    const assignmentGrades = await prisma.assignmentSubmission.findMany({
      where: whereClause,
      include: {
        assignment: {
          include: {
            semesterCourse: {
              include: {
                course: true
              }
            }
          }
        }
      }
    })

    const examGrades = await prisma.examSubmission.findMany({
      where: {
        studentId,
        status: "GRADED",
        ...(semesterCourseId && {
          exam: {
            semesterCourseId
          }
        })
      },
      include: {
        exam: {
          include: {
            semesterCourse: {
              include: {
                course: true
              }
            }
          }
        }
      }
    })

    const grades = [
      ...assignmentGrades.map(grade => ({
        id: grade.id,
        type: 'assignment',
        courseId: grade.assignment.semesterCourse.course.id,
        courseName: grade.assignment.semesterCourse.course.name,
        courseCode: grade.assignment.semesterCourse.course.code,
        title: grade.assignment.title,
        grade: grade.grade!,
        totalPoints: grade.assignment.totalPoints,
        percentage: Math.round((grade.grade! / grade.assignment.totalPoints) * 100),
        feedback: grade.feedback,
        gradedAt: grade.gradedAt
      })),
      ...examGrades.map(grade => ({
        id: grade.id,
        type: 'exam',
        courseId: grade.exam.semesterCourse.course.id,
        courseName: grade.exam.semesterCourse.course.name,
        courseCode: grade.exam.semesterCourse.course.code,
        title: grade.exam.title,
        grade: grade.grade!,
        totalPoints: grade.exam.totalPoints,
        percentage: Math.round((grade.grade! / grade.exam.totalPoints) * 100),
        feedback: grade.feedback,
        gradedAt: grade.gradedAt
      }))
    ]

    return {
      success: true,
      data: grades,
    }
  } catch (error) {
    console.error("Error fetching student grades:", error)
    return {
      success: false,
      error: "Failed to fetch grades",
    }
  }
}

// Get course syllabus
export async function getCourseSyllabus(semesterCourseId: string) {
  try {
    const syllabus = await prisma.courseSyllabus.findMany({
      where: {
        semesterCourseId
      },
      orderBy: {
        week: 'asc'
      }
    })

    return {
      success: true,
      data: syllabus,
    }
  } catch (error) {
    console.error("Error fetching course syllabus:", error)
    return {
      success: false,
      error: "Failed to fetch course syllabus",
    }
  }
}

// Get course calendar events
export async function getCourseCalendarEvents(semesterCourseId: string) {
  try {
    const events = await prisma.calendarEvent.findMany({
      where: {
        semesterCourseId,
        status: "SCHEDULED"
      },
      orderBy: {
        date: 'asc'
      }
    })

    return {
      success: true,
      data: events,
    }
  } catch (error) {
    console.error("Error fetching course calendar events:", error)
    return {
      success: false,
      error: "Failed to fetch course calendar events",
    }
  }
}