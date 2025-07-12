"use server"

import prisma from "@/app/lib/prisma"
import { z } from "zod"


// Types for dashboard data
export type DashboardStats = {
  totalStudents: number
  activeCourses: number
  pendingAssignments: number
  avgAttendance: number
  upcomingExams: number
  gradedAssignments: number
  totalClasses: number
  completionRate: number
}

export type RecentActivity = {
  id: string
  type: "assignment" | "grade" | "announcement" | "attendance" | "exam"
  title: string
  time: string
  course: string
  courseCode: string
}

export type UpcomingEvent = {
  id: string
  title: string
  type: "lecture" | "exam" | "office-hours" | "meeting" | "deadline"
  date: string
  time: string
  duration: string
  room: string
  courseCode?: string
}

export type CoursePerformance = {
  id: string
  name: string
  code: string
  averageGrade: number
  completionRate: number
  totalStudents: number
  color: string
}

export type QuickActionData = {
  pendingGrading: number
  todayClasses: number
  unreadMessages: number
  upcomingDeadlines: number
}

// Validation schemas
const dashboardFiltersSchema = z.object({
  period: z.enum(["week", "month", "semester"]).default("week"),
  teacherId: z.string().min(1, "Teacher ID is required"),
})

// Main dashboard data fetcher
export async function getDashboardData(teacherId: string, period: "week" | "month" | "semester" = "week") {
  try {
    const validatedData = dashboardFiltersSchema.parse({ teacherId, period })

    // Calculate date ranges based on period
    const now = new Date()
    let startDate: Date
    const endDate = new Date(now)

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "semester":
        // Assuming semester starts in September or January
        const currentMonth = now.getMonth()
        if (currentMonth >= 8) {
          // Fall semester (Sep-Dec)
          startDate = new Date(now.getFullYear(), 8, 1)
        } else {
          // Spring semester (Jan-May)
          startDate = new Date(now.getFullYear(), 0, 1)
        }
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Fetch all data in parallel
    const [stats, recentActivities, upcomingEvents, coursePerformance, quickActionData] = await Promise.all([
      getDashboardStats(teacherId, startDate, endDate),
      getRecentActivities(teacherId, startDate, endDate),
      getUpcomingEvents(teacherId),
      getCoursePerformance(teacherId),
      getQuickActionData(teacherId),
    ])

    return {
      success: true,
      data: {
        stats,
        recentActivities,
        upcomingEvents,
        coursePerformance,
        quickActionData,
        period,
      },
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return { success: false, error: "Failed to fetch dashboard data" }
  }
}

// Get dashboard statistics
async function getDashboardStats(teacherId: string, startDate: Date, endDate: Date): Promise<DashboardStats> {
  // Get teacher's active courses
  const activeCourses = await prisma.semesterCourse.findMany({
    where: {
      instructorId: teacherId,
      status: "ACTIVE",
    },
    include: {
      enrollments: true,
      assignments: {
        where: {
          status: "ACTIVE",
        },
      },
      exams: {
        where: {
          status: { in: ["SCHEDULED", "ACTIVE"] },
        },
      },
      attendanceRecords: {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  })

  // Calculate total students across all courses
  const totalStudents = activeCourses.reduce((sum, course) => sum + course.enrollments.length, 0)

  // Count pending assignments (assignments with submissions that need grading)
  const pendingAssignments = await prisma.assignmentSubmission.count({
    where: {
      assignment: {
        semesterCourse: {
          instructorId: teacherId,
        },
      },
      status: "SUBMITTED",
    },
  })

  // Calculate average attendance
  const attendanceRecords = activeCourses.flatMap((course) => course.attendanceRecords)
  const totalAttendanceRecords = attendanceRecords.length
  const presentRecords = attendanceRecords.filter((record) => record.status === "PRESENT").length
  const avgAttendance = totalAttendanceRecords > 0 ? Math.round((presentRecords / totalAttendanceRecords) * 100) : 0

  // Count upcoming exams
  const upcomingExams = activeCourses.reduce((sum, course) => {
    return sum + course.exams.filter((exam) => exam.examDate > new Date()).length
  }, 0)

  // Count graded assignments in the period
  const gradedAssignments = await prisma.assignmentSubmission.count({
    where: {
      assignment: {
        semesterCourse: {
          instructorId: teacherId,
        },
      },
      status: "GRADED",
      gradedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  })

  // Count classes taught (calendar events of type CLASS)
  const totalClasses = await prisma.calendarEvent.count({
    where: {
      teacherId,
      type: "CLASS",
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: "COMPLETED",
    },
  })

  // Calculate completion rate (percentage of assignments submitted vs total assignments)
  const totalAssignments = activeCourses.reduce((sum, course) => sum + course.assignments.length, 0)
  const submittedAssignments = await prisma.assignmentSubmission.count({
    where: {
      assignment: {
        semesterCourse: {
          instructorId: teacherId,
        },
      },
    },
  })
  const completionRate =
    totalAssignments > 0 ? Math.round((submittedAssignments / (totalAssignments * totalStudents)) * 100) : 0

  return {
    totalStudents,
    activeCourses: activeCourses.length,
    pendingAssignments,
    avgAttendance,
    upcomingExams,
    gradedAssignments,
    totalClasses,
    completionRate,
  }
}

// Get recent activities
async function getRecentActivities(teacherId: string, startDate: Date, endDate: Date): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = []

  // Recent assignment submissions
  const recentSubmissions = await prisma.assignmentSubmission.findMany({
    where: {
      assignment: {
        semesterCourse: {
          instructorId: teacherId,
        },
      },
      submittedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      student: true,
      assignment: {
        include: {
          semesterCourse: {
            include: {
              course: true,
            },
          },
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
    take: 5,
  })

  recentSubmissions.forEach((submission) => {
    activities.push({
      id: submission.id,
      type: "assignment",
      title: `${submission.assignment.title} submitted by ${submission.student.firstName} ${submission.student.lastName}`,
      time: getRelativeTime(submission.submittedAt),
      course: submission.assignment.semesterCourse.course.name,
      courseCode: submission.assignment.semesterCourse.course.code,
    })
  })

  // Recent grading activities
  const recentGrading = await prisma.assignmentSubmission.findMany({
    where: {
      assignment: {
        semesterCourse: {
          instructorId: teacherId,
        },
      },
      status: "GRADED",
      gradedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      assignment: {
        include: {
          semesterCourse: {
            include: {
              course: true,
            },
          },
        },
      },
    },
    orderBy: {
      gradedAt: "desc",
    },
    take: 3,
  })

  recentGrading.forEach((graded) => {
    const gradedCount = recentGrading.filter((g) => g.assignmentId === graded.assignmentId).length
    activities.push({
      id: `graded-${graded.id}`,
      type: "grade",
      title: `Graded ${graded.assignment.title} for ${gradedCount} students`,
      time: getRelativeTime(graded.gradedAt!),
      course: graded.assignment.semesterCourse.course.name,
      courseCode: graded.assignment.semesterCourse.course.code,
    })
  })

  // Recent announcements
  const recentAnnouncements = await prisma.courseAnnouncement.findMany({
    where: {
      semesterCourse: {
        instructorId: teacherId,
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      semesterCourse: {
        include: {
          course: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
  })

  recentAnnouncements.forEach((announcement) => {
    activities.push({
      id: announcement.id,
      type: "announcement",
      title: `Posted announcement: ${announcement.title}`,
      time: getRelativeTime(announcement.createdAt),
      course: announcement.semesterCourse.course.name,
      courseCode: announcement.semesterCourse.course.code,
    })
  })

  // Recent attendance marking
  const recentAttendance = await prisma.courseAttendance.findMany({
    where: {
      semesterCourse: {
        instructorId: teacherId,
      },
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      semesterCourse: {
        include: {
          course: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
    take: 2,
  })

  // Group attendance by date and course
  const attendanceByDateCourse = recentAttendance.reduce(
    (acc, record) => {
      const key = `${record.date.toDateString()}-${record.semesterCourseId}`
      if (!acc[key]) {
        acc[key] = {
          date: record.date,
          course: record.semesterCourse.course.name,
          courseCode: record.semesterCourse.course.code,
          count: 0,
        }
      }
      acc[key].count++
      return acc
    },
    {} as Record<string, any>,
  )

  Object.values(attendanceByDateCourse).forEach((attendance: any) => {
    activities.push({
      id: `attendance-${attendance.date.getTime()}`,
      type: "attendance",
      title: `Marked attendance for ${attendance.count} students`,
      time: getRelativeTime(attendance.date),
      course: attendance.course,
      courseCode: attendance.courseCode,
    })
  })

  // Sort all activities by time and return top 10
  return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10)
}

// Get upcoming events
async function getUpcomingEvents(teacherId: string): Promise<UpcomingEvent[]> {
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Get calendar events
  const calendarEvents = await prisma.calendarEvent.findMany({
    where: {
      teacherId,
      date: {
        gte: now,
        lte: nextWeek,
      },
      status: "SCHEDULED",
    },
    include: {
      semesterCourse: {
        include: {
          course: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
    take: 5,
  })

  const events: UpcomingEvent[] = calendarEvents.map((event) => ({
    id: event.id,
    title: event.title,
    type: event.type.toLowerCase() as UpcomingEvent["type"],
    date: event.date.toISOString().split("T")[0],
    time: event.time,
    duration: event.duration ? `${event.duration} minutes` : "TBD",
    room: event.location || "TBD",
    courseCode: event.semesterCourse?.course.code,
  }))

  // Get upcoming exams
  const upcomingExams = await prisma.courseExam.findMany({
    where: {
      semesterCourse: {
        instructorId: teacherId,
      },
      examDate: {
        gte: now,
        lte: nextWeek,
      },
      status: { in: ["SCHEDULED", "ACTIVE"] },
    },
    include: {
      semesterCourse: {
        include: {
          course: true,
        },
      },
    },
    orderBy: {
      examDate: "asc",
    },
    take: 3,
  })

  upcomingExams.forEach((exam) => {
    events.push({
      id: exam.id,
      title: `${exam.title} - ${exam.semesterCourse.course.name}`,
      type: "exam",
      date: exam.examDate.toISOString().split("T")[0],
      time: exam.examDate.toTimeString().slice(0, 5),
      duration: `${exam.duration} minutes`,
      room: "TBD", // You might want to add room field to CourseExam model
      courseCode: exam.semesterCourse.course.code,
    })
  })

  // Get assignment deadlines
  const upcomingDeadlines = await prisma.courseAssignment.findMany({
    where: {
      semesterCourse: {
        instructorId: teacherId,
      },
      dueDate: {
        gte: now,
        lte: nextWeek,
      },
      status: "ACTIVE",
    },
    include: {
      semesterCourse: {
        include: {
          course: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
    take: 3,
  })

  upcomingDeadlines.forEach((assignment) => {
    events.push({
      id: assignment.id,
      title: `${assignment.title} Due`,
      type: "deadline",
      date: assignment.dueDate.toISOString().split("T")[0],
      time: assignment.dueDate.toTimeString().slice(0, 5),
      duration: "Deadline",
      room: "N/A",
      courseCode: assignment.semesterCourse.course.code,
    })
  })

  return events.sort((a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime())
}

// Get course performance data
async function getCoursePerformance(teacherId: string): Promise<CoursePerformance[]> {
  const courses = await prisma.semesterCourse.findMany({
    where: {
      instructorId: teacherId,
      status: "ACTIVE",
    },
    include: {
      course: true,
      enrollments: true,
      courseGrades: true,
      assignments: {
        include: {
          submissions: true,
        },
      },
    },
  })

  const colors = ["bg-green-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500"]

  return courses.map((course, index) => {
    // Calculate average grade
    const grades = course.courseGrades.filter((grade) => grade.percentage !== null)
    const averageGrade =
      grades.length > 0 ? grades.reduce((sum, grade) => sum + Number(grade.percentage), 0) / grades.length : 0

    // Calculate completion rate
    const totalAssignments = course.assignments.length
    const totalStudents = course.enrollments.length
    const totalSubmissions = course.assignments.reduce((sum, assignment) => sum + assignment.submissions.length, 0)
    const completionRate =
      totalAssignments > 0 && totalStudents > 0 ? (totalSubmissions / (totalAssignments * totalStudents)) * 100 : 0

    return {
      id: course.id,
      name: course.course.name,
      code: course.course.code,
      averageGrade: Math.round(averageGrade),
      completionRate: Math.round(completionRate),
      totalStudents,
      color: colors[index % colors.length],
    }
  })
}

// Get quick action data
async function getQuickActionData(teacherId: string): Promise<QuickActionData> {
  // Pending grading count
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

  // Today's classes
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  const todayClasses = await prisma.calendarEvent.count({
    where: {
      teacherId,
      type: "CLASS",
      date: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
  })

  // Unread messages (you might need to implement a message system)
  const unreadMessages = 0 // Placeholder - implement based on your message system

  // Upcoming deadlines (next 7 days)
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingDeadlines = await prisma.courseAssignment.count({
    where: {
      semesterCourse: {
        instructorId: teacherId,
      },
      dueDate: {
        gte: today,
        lte: nextWeek,
      },
      status: "ACTIVE",
    },
  })

  return {
    pendingGrading,
    todayClasses,
    unreadMessages,
    upcomingDeadlines,
  }
}

// Teacher profile and preferences
export async function getTeacherProfile(teacherId: string) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        semesterCourse: {
          include: {
            course: {
              include: {
                department: true,
              },
            },
          },
        },
      },
    })

    if (!teacher) {
      return { success: false, error: "Teacher not found" }
    }

    return {
      success: true,
      teacher: {
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
        department: teacher.semesterCourse[0]?.course.department.name || "Computer Science",
        courses: teacher.semesterCourse.map((sc) => ({
          id: sc.id,
          name: sc.course.name,
          code: sc.course.code,
        })),
      },
    }
  } catch (error) {
    console.error("Error fetching teacher profile:", error)
    return { success: false, error: "Failed to fetch teacher profile" }
  }
}

// Quick actions
export async function markAttendance(
  semesterCourseId: string,
  attendanceData: Array<{
    studentId: string
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
    notes?: string
  }>,
) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const attendanceRecords = await prisma.courseAttendance.createMany({
      data: attendanceData.map((record) => ({
        studentId: record.studentId,
        semesterCourseId,
        date: today,
        status: record.status,
        notes: record.notes,
      })),
      skipDuplicates: true,
    })

    return { success: true, count: attendanceRecords.count }
  } catch (error) {
    console.error("Error marking attendance:", error)
    return { success: false, error: "Failed to mark attendance" }
  }
}

export async function createQuickAnnouncement(
  semesterCourseId: string,
  title: string,
  content: string,
  priority: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM",
) {
  try {
    const announcement = await prisma.courseAnnouncement.create({
      data: {
        semesterCourseId,
        title,
        content,
        priority,
      },
    })

    return { success: true, announcement }
  } catch (error) {
    console.error("Error creating announcement:", error)
    return { success: false, error: "Failed to create announcement" }
  }
}

// Utility function to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "Just now"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? "s" : ""} ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? "s" : ""} ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Export types for use in components
// export type { DashboardStats, RecentActivity, UpcomingEvent, CoursePerformance, QuickActionData }
