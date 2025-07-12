"use server"

import prisma from "@/app/lib/prisma"


export async function getStudentDashboardData(studentId: string) {
  try {
    // Get student basic info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        program: true,
      },
    })

    if (!student) {
      throw new Error("Student not found")
    }

    // Get enrolled courses
    const enrolledCourses = await prisma.studentEnrollment.findMany({
      where: {
        studentId: studentId,
        status: "active",
      },
      include: {
        semesterCourse: {
          include: {
            course: {
              include: {
                department: true,
              },
            },
            instructor: true,
          },
        },
      },
      take: 10,
    })

    // Get upcoming assignments
    const upcomingAssignments = await prisma.courseAssignment.findMany({
      where: {
        semesterCourse: {
          enrollments: {
            some: {
              studentId: studentId,
              status: "active",
            },
          },
        },
        status: "ACTIVE",
        dueDate: {
          gte: new Date(),
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
        dueDate: "asc",
      },
      take: 5,
    })

    // Get recent announcements
    const recentAnnouncements = await prisma.courseAnnouncement.findMany({
      where: {
        semesterCourse: {
          enrollments: {
            some: {
              studentId: studentId,
              status: "active",
            },
          },
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
      take: 5,
    })

    // Get upcoming exams
    const upcomingExams = await prisma.courseExam.findMany({
      where: {
        semesterCourse: {
          enrollments: {
            some: {
              studentId: studentId,
              status: "active",
            },
          },
        },
        status: "SCHEDULED",
        examDate: {
          gte: new Date(),
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
        examDate: "asc",
      },
      take: 5,
    })

    // Get recent grades
    const recentGrades = await prisma.courseGrade.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        semesterCourse: {
          include: {
            course: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
    })

    // Get calendar events
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: {
        semesterCourse: {
          enrollments: {
            some: {
              studentId: studentId,
              status: "active",
            },
          },
        },
        date: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
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
      take: 10,
    })

    return {
      student,
      enrolledCourses,
      upcomingAssignments,
      recentAnnouncements,
      upcomingExams,
      recentGrades,
      calendarEvents,
    }
  } catch (error) {
    console.error("Error fetching student dashboard data:", error)
    throw new Error("Failed to fetch dashboard data")
  }
}

export async function getStudentStats(studentId: string) {
  try {
    const totalCourses = await prisma.studentEnrollment.count({
      where: {
        studentId: studentId,
        status: "active",
      },
    })

    const pendingAssignments = await prisma.courseAssignment.count({
      where: {
        semesterCourse: {
          enrollments: {
            some: {
              studentId: studentId,
              status: "active",
            },
          },
        },
        status: "ACTIVE",
        dueDate: {
          gte: new Date(),
        },
      },
    })

    const upcomingExams = await prisma.courseExam.count({
      where: {
        semesterCourse: {
          enrollments: {
            some: {
              studentId: studentId,
              status: "active",
            },
          },
        },
        status: "SCHEDULED",
        examDate: {
          gte: new Date(),
        },
      },
    })

    return {
      totalCourses,
      pendingAssignments,
      upcomingExams,
    }
  } catch (error) {
    console.error("Error fetching student stats:", error)
    throw new Error("Failed to fetch student stats")
  }
}
