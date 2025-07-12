"use server"

import prisma from "@/app/lib/prisma"
import { z } from "zod"

// Validation schemas
const ReportsFilterSchema = z.object({
  period: z.enum(["semester", "year", "quarter"]).default("semester"),
  department: z.string().default("all"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

type ReportsFilter = z.infer<typeof ReportsFilterSchema>

// Helper function to get date range based on period
function getDateRange(period: string) {
  const now = new Date()
  const startDate = new Date()

  switch (period) {
    case "semester":
      // Current semester (last 6 months)
      startDate.setMonth(now.getMonth() - 6)
      break
    case "year":
      // Academic year (last 12 months)
      startDate.setFullYear(now.getFullYear() - 1)
      break
    case "quarter":
      // Quarter (last 3 months)
      startDate.setMonth(now.getMonth() - 3)
      break
    default:
      startDate.setMonth(now.getMonth() - 6)
  }

  return { startDate, endDate: now }
}

export async function getOverviewStats(filters: ReportsFilter = {} as any) {
  try {
    const validatedFilters = ReportsFilterSchema.parse(filters)
    const { startDate, endDate } = getDateRange(validatedFilters.period)

    // Build where clause for department filtering
    const departmentWhere =
      validatedFilters.department !== "all" ? { program: { department: { slug: validatedFilters.department } } } : {}

    // Get total students
    const totalStudents = await prisma.student.count({
      where: {
        status: "active",
        ...departmentWhere as any,
      },
    })

    // Get students from previous period for comparison
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 6)

    const previousStudents = await prisma.student.count({
      where: {
        status: "active",
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
        ...departmentWhere as any,
      },
    })

    // Get active courses
    const activeCourses = await prisma.semesterCourse.count({
      where: {
        status: "ACTIVE",
        ...(validatedFilters.department !== "all" && {
          course: { department: { slug: validatedFilters.department } },
        }),
      },
    })

    // Get faculty members
    const facultyMembers = await prisma.teacher.count({
      where: {
        status: "active",
      },
    })

    // Calculate graduation rate (students with completed status)
    const completedStudents = await prisma.student.count({
      where: {
        registratioProcess: "completed",
        ...departmentWhere as any,
      },
    })

    const graduationRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0

    // Calculate changes
    const studentChange = previousStudents > 0 ? ((totalStudents - previousStudents) / previousStudents) * 100 : 0

    return {
      success: true,
      data: {
        totalStudents: {
          value: totalStudents.toLocaleString(),
          change: `${studentChange >= 0 ? "+" : ""}${studentChange.toFixed(1)}%`,
          trend: studentChange >= 0 ? "up" : "down",
        },
        activeCourses: {
          value: activeCourses.toString(),
          change: "+12", // You can calculate this based on historical data
          trend: "up",
        },
        facultyMembers: {
          value: facultyMembers.toString(),
          change: "+3", // You can calculate this based on historical data
          trend: "up",
        },
        graduationRate: {
          value: `${graduationRate.toFixed(1)}%`,
          change: "+2.1%", // You can calculate this based on historical data
          trend: "up",
        },
      },
    }
  } catch (error) {
    console.error("Error fetching overview stats:", error)
    return { success: false, error: "Failed to fetch overview statistics" }
  }
}

export async function getEnrollmentData(filters: ReportsFilter = {} as any) {
  try {
    const validatedFilters = ReportsFilterSchema.parse(filters)
    const { startDate, endDate } = getDateRange(validatedFilters.period)

    // Build where clause for department filtering
    const departmentWhere =
      validatedFilters.department !== "all"
        ? { student: { program: { department: { slug: validatedFilters.department } } } }
        : {}

    // Get enrollment data by month for the last 6 months
    const enrollmentData = []
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0)
      monthEnd.setHours(23, 59, 59, 999)

      // Total students up to this month
      const totalStudents = await prisma.student.count({
        where: {
          status: "active",
          createdAt: { lte: monthEnd },
          ...(validatedFilters.department !== "all" && {
            program: { department: { slug: validatedFilters.department } } as any,
          }),
        },
      })

      // New enrollments in this month
      const newEnrollments = await prisma.student.count({
        where: {
          status: "active",
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
          ...(validatedFilters.department !== "all" && {
            program: { department: { slug: validatedFilters.department } } as any,
          }),
        },
      })

      enrollmentData.push({
        month: months[monthStart.getMonth()],
        students: totalStudents,
        newEnrollments,
      })
    }

    return {
      success: true,
      data: enrollmentData,
    }
  } catch (error) {
    console.error("Error fetching enrollment data:", error)
    return { success: false, error: "Failed to fetch enrollment data" }
  }
}

export async function getDepartmentData(filters: ReportsFilter = {} as any) {
  try {
    const validatedFilters = ReportsFilterSchema.parse(filters)

    // Get departments with student counts
    const departments = await prisma.department.findMany({
      include: {
        courses: {
          include: {
            _count: {
              select: {
                semesterCourse: {
                  where: {
                    enrollments: {
                      some: {
                        status: "active",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    // Get student counts by department through programs
    const departmentData = await Promise.all(
      departments.map(async (dept, index) => {
        const studentCount = await prisma.student.count({
          where: {
            status: "active",
            program: {
              // Assuming there's a relationship between Program and Department
              // You might need to adjust this based on your actual schema
              id: {
                in: await prisma.program
                  .findMany({
                    select: { id: true },
                    // Add department relationship if it exists
                  })
                  .then((programs) => programs.map((p) => p.id)),
              },
            },
          },
        })

        // Generate colors for the pie chart
        const colors = [
          "#7c3aed",
          "#a855f7",
          "#c084fc",
          "#d8b4fe",
          "#e9d5ff",
          "#f3e8ff",
          "#8b5cf6",
          "#9333ea",
          "#a21caf",
          "#be185d",
          "#dc2626",
          "#ea580c",
        ]

        return {
          name: dept.name,
          students: studentCount,
          color: colors[index % colors.length],
        }
      }),
    )

    return {
      success: true,
      data: departmentData.filter((dept) => dept.students > 0), // Only return departments with students
    }
  } catch (error) {
    console.error("Error fetching department data:", error)
    return { success: false, error: "Failed to fetch department data" }
  }
}

export async function getPerformanceData(filters: ReportsFilter = {} as any) {
  try {
    const validatedFilters = ReportsFilterSchema.parse(filters)

    // Get performance data by semester
    // This is a simplified version - you might want to adjust based on your semester structure
    const performanceData = []
    const semesters = ["Fall 2023", "Spring 2024", "Summer 2024", "Fall 2024"]

    for (const semesterName of semesters) {
      // Get average GPA for the semester
      const grades = await prisma.courseGrade.findMany({
        where: {
          semesterCourse: {
            semester: semesterName,
            ...(validatedFilters.department !== "all" && {
              course: { department: { slug: validatedFilters.department } },
            }),
          },
        },
        select: {
          gradePoints: true,
        },
      })

      const avgGPA =
        grades.length > 0 ? grades.reduce((sum, grade) => sum + (Number(grade.gradePoints) || 0), 0) / grades.length : 0

      // Get completion rate
      const totalEnrollments = await prisma.studentEnrollment.count({
        where: {
          semesterCourse: {
            semester: semesterName,
            ...(validatedFilters.department !== "all" && {
              course: { department: { slug: validatedFilters.department } },
            }),
          },
        },
      })

      const completedEnrollments = await prisma.studentEnrollment.count({
        where: {
          status: "completed",
          semesterCourse: {
            semester: semesterName,
            ...(validatedFilters.department !== "all" && {
              course: { department: { slug: validatedFilters.department } },
            }),
          },
        },
      })

      const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0

      performanceData.push({
        semester: semesterName,
        gpa: Number(avgGPA.toFixed(1)),
        completion: Number(completionRate.toFixed(0)),
      })
    }

    return {
      success: true,
      data: performanceData,
    }
  } catch (error) {
    console.error("Error fetching performance data:", error)
    return { success: false, error: "Failed to fetch performance data" }
  }
}

export async function getRecentStudents(filters: ReportsFilter = {} as any) {
  try {
    const validatedFilters = ReportsFilterSchema.parse(filters)

    // Build where clause for department filtering
    const departmentWhere =
      validatedFilters.department !== "all" ? { program: { department: { slug: validatedFilters.department } } } : {}

    // Get recent students with their latest grades
    const students = await prisma.student.findMany({
      where: {
        status: "active",
        ...departmentWhere as any,
      },
      include: {
        program: {
          
        },
        courseGrades: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    const recentStudents = students.map((student) => {
      // Calculate average GPA from recent grades
      const avgGPA = student.courseGrades.length > 0 ? Number(student.courseGrades[0].gradePoints) || 3.0 : 3.0

      return {
        id: student.matriculationNumber || student.id,
        name: `${student.firstName} ${student.lastName}`,
        department: student.program?.name || "Unassigned",
        gpa: Number(avgGPA.toFixed(1)),
        status: student.status === "active" ? "Active" : "Inactive",
      }
    })

    return {
      success: true,
      data: recentStudents,
    }
  } catch (error) {
    console.error("Error fetching recent students:", error)
    return { success: false, error: "Failed to fetch recent students" }
  }
}

export async function getDepartmentOptions() {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    })

    const options = [
      { value: "all", label: "All Departments" },
      ...departments.map((dept) => ({
        value: dept.slug,
        label: dept.name,
      })),
    ]

    return {
      success: true,
      data: options,
    }
  } catch (error) {
    console.error("Error fetching department options:", error)
    return { success: false, error: "Failed to fetch departments" }
  }
}

export async function searchStudents(query: string, filters: ReportsFilter = {} as any) {
  try {
    const validatedFilters = ReportsFilterSchema.parse(filters)

    if (!query || query.length < 2) {
      return { success: true, data: [] }
    }

    // Build where clause for department filtering
    const departmentWhere =
      validatedFilters.department !== "all" ? { program: { department: { slug: validatedFilters.department } } } : {}

    const students = await prisma.student.findMany({
      where: {
        AND: [
          {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { matriculationNumber: { contains: query, mode: "insensitive" } },
            ],
          },
          departmentWhere as any,
        ],
      },
      include: {
        program: {
        },
        courseGrades: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      take: 20,
    })

    const searchResults = students.map((student) => {
      const avgGPA = student.courseGrades.length > 0 ? Number(student.courseGrades[0].gradePoints) || 3.0 : 3.0

      return {
        id: student.matriculationNumber || student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        department: student.program?.name || "Unassigned",
        gpa: Number(avgGPA.toFixed(1)),
        status: student.status === "active" ? "Active" : "Inactive",
      }
    })

    return {
      success: true,
      data: searchResults,
    }
  } catch (error) {
    console.error("Error searching students:", error)
    return { success: false, error: "Failed to search students" }
  }
}

export async function exportReportData(filters: ReportsFilter = {} as any) {
  try {
    const validatedFilters = ReportsFilterSchema.parse(filters)

    // Get all data for export
    const [overviewStats, enrollmentData, departmentData, performanceData, recentStudents] = await Promise.all([
      getOverviewStats(validatedFilters),
      getEnrollmentData(validatedFilters),
      getDepartmentData(validatedFilters),
      getPerformanceData(validatedFilters),
      getRecentStudents(validatedFilters),
    ])

    const exportData = {
      generatedAt: new Date().toISOString(),
      filters: validatedFilters,
      overviewStats: overviewStats.success ? overviewStats.data : null,
      enrollmentData: enrollmentData.success ? enrollmentData.data : null,
      departmentData: departmentData.success ? departmentData.data : null,
      performanceData: performanceData.success ? performanceData.data : null,
      recentStudents: recentStudents.success ? recentStudents.data : null,
    }

    return {
      success: true,
      data: exportData,
    }
  } catch (error) {
    console.error("Error exporting report data:", error)
    return { success: false, error: "Failed to export report data" }
  }
}
