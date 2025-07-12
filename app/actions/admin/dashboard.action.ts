"use server"


import { z } from "zod"
import { revalidatePath } from "next/cache"
import prisma from "@/app/lib/prisma"

// Validation schemas
const UserCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["student", "teacher", "admin"]),
  phoneNumber: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

const CourseCreateSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  code: z.string().min(1, "Course code is required"),
  description: z.string().optional(),
  credits: z.number().min(1, "Credits must be at least 1"),
  maxStudents: z.number().min(1, "Max students must be at least 1"),
  teacherId: z.string().min(1, "Teacher is required"),
  departmentId: z.string().min(1, "Department is required"),
})

const UserUpdateSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]),
})

// Types
export type SystemStats = {
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalCourses: number
  activeCourses: number
  totalEnrollments: number
  pendingApplications: number
  systemHealth: number
  revenue: number
  revenueGrowth: number
}

export type RecentActivity = {
  id: string
  type: "enrollment" | "course_created" | "user_registered" | "assignment_submitted" | "exam_completed"
  description: string
  user: string
  timestamp: string
  status: "success" | "pending" | "failed"
}

export type DashboardUser = {
  id: string
  name: string
  email: string
  role: "student" | "teacher" | "admin"
  status: "active" | "inactive" | "suspended"
  lastLogin: string
  enrolledCourses?: number
  createdCourses?: number
  joinDate: string
}

export type DashboardCourse = {
  id: string
  name: string
  code: string
  instructor: string
  enrolledStudents: number
  maxStudents: number
  status: "active" | "inactive" | "upcoming"
  revenue: number
  rating: number
  createdDate: string
}

export type SystemHealth = {
  cpu: number
  memory: number
  storage: number
  network: number
  database: number
  uptime: string
  lastBackup: string
}

export type Analytics = {
  userGrowth: { month: string; students: number; teachers: number }[]
  coursePopularity: { name: string; enrollments: number }[]
  revenueData: { month: string; revenue: number }[]
  engagementMetrics: {
    dailyActiveUsers: number
    weeklyActiveUsers: number
    monthlyActiveUsers: number
    averageSessionTime: number
  }
}

export async function getSystemStats(): Promise<{ success: boolean; data?: SystemStats; error?: string }> {
  try {
    // Get user counts
    const [totalStudents, totalTeachers, totalAdmins] = await Promise.all([
      prisma.student.count({ where: { status: "active" } }),
      prisma.teacher.count({ where: { status: "active" } }),
      prisma.admin.count({ where: { status: "active" } }),
    ])

    const totalUsers = totalStudents + totalTeachers + totalAdmins

    // Get course counts
    const [totalCourses, activeCourses] = await Promise.all([
      prisma.course.count(),
      prisma.semesterCourse.count({ where: { status: "ACTIVE" } }),
    ])

    // Get enrollment count
    const totalEnrollments = await prisma.studentEnrollment.count({
      where: { status: "active" },
    })

    // Get pending applications (students with pending status)
    const pendingApplications = await prisma.student.count({
      where: { registratioProcess: "pending" },
    })

    // Calculate revenue (mock calculation based on enrollments)
    const revenue = totalEnrollments * 500 // Assuming $500 per enrollment
    const revenueGrowth = 15.5 // Mock growth percentage

    // System health (mock calculation)
    const systemHealth = 98

    const stats: SystemStats = {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalCourses,
      activeCourses,
      totalEnrollments,
      pendingApplications,
      systemHealth,
      revenue,
      revenueGrowth,
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error("Error fetching system stats:", error)
    return { success: false, error: "Failed to fetch system statistics" }
  }
}

export async function getRecentActivities(): Promise<{ success: boolean; data?: RecentActivity[]; error?: string }> {
  try {
    // Get recent enrollments
    const recentEnrollments = await prisma.studentEnrollment.findMany({
      where: { status: "active" },
      include: {
        student: true,
        semesterCourse: {
          include: { course: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    // Get recent students
    const recentStudents = await prisma.student.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    // Get recent courses
    const recentCourses = await prisma.semesterCourse.findMany({
      include: { instructor: true ,course:true},
      orderBy: { createdAt: "desc" },
      take: 3,
    })

    const activities: RecentActivity[] = []

    // Add enrollment activities
    recentEnrollments.forEach((enrollment, index) => {
      activities.push({
        id: `enrollment-${enrollment.id}`,
        type: "enrollment",
        description: `${enrollment.student.firstName} ${enrollment.student.lastName} enrolled in ${enrollment.semesterCourse.course.name}`,
        user: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        timestamp: enrollment.createdAt.toISOString(),
        status: "success",
      })
    })

    // Add user registration activities
    recentStudents.forEach((student, index) => {
      activities.push({
        id: `registration-${student.id}`,
        type: "user_registered",
        description: `New student ${student.firstName} ${student.lastName} registered`,
        user: `${student.firstName} ${student.lastName}`,
        timestamp: student.createdAt.toISOString(),
        status: student.status === "active" ? "success" : "pending",
      })
    })

    // Add course creation activities
    recentCourses.forEach((course, index) => {
      activities.push({
        id: `course-${course.id}`,
        type: "course_created",
        description: `New course "${course.course.name}" created`,
        user: course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : "System",
        timestamp: course.createdAt.toISOString(),
        status: "success",
      })
    })

    // Sort by timestamp and limit to 20 most recent
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)

    return { success: true, data: sortedActivities }
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    return { success: false, error: "Failed to fetch recent activities" }
  }
}

export async function getUserManagement(): Promise<{ success: boolean; data?: DashboardUser[]; error?: string }> {
  try {
    // Get students
    const students = await prisma.student.findMany({
      include: {
        enrollments: {
          where: { status: "active" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    // Get teachers
    const teachers = await prisma.teacher.findMany({
      include: {
        semesterCourse: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    // Get admins
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const users: DashboardUser[] = []

    // Transform students
    students.forEach((student) => {
      users.push({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        role: "student",
        status: student.status as "active" | "inactive" | "suspended",
        lastLogin: student.updatedAt.toISOString(),
        enrolledCourses: student.enrollments.length,
        joinDate: student.createdAt.toISOString(),
      })
    })

    // Transform teachers
    teachers.forEach((teacher) => {
      users.push({
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
        role: "teacher",
        status: teacher.status as "active" | "inactive" | "suspended",
        lastLogin: teacher.updatedAt.toISOString(),
        createdCourses: teacher.semesterCourse.length,
        joinDate: teacher.createdAt.toISOString(),
      })
    })

    // Transform admins
    admins.forEach((admin) => {
      users.push({
        id: admin.id,
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        role: "admin",
        status: admin.status as "active" | "inactive" | "suspended",
        lastLogin: admin.updatedAt.toISOString(),
        joinDate: admin.createdAt.toISOString(),
      })
    })

    return { success: true, data: users }
  } catch (error) {
    console.error("Error fetching user management data:", error)
    return { success: false, error: "Failed to fetch user data" }
  }
}

export async function getCourseManagement(): Promise<{ success: boolean; data?: DashboardCourse[]; error?: string }> {
  try {
    const courses = await prisma.course.findMany({
      include: {
        
        semesterCourse: {
          include: {
            enrollments: {
              where: { status: "active" },
            },
            instructor:true
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    const dashboardCourses: DashboardCourse[] = courses.map((course) => {
      const activeSemesterCourse = course.semesterCourse.find((sc) => sc.status === "ACTIVE")
      const enrolledStudents = activeSemesterCourse?.enrollments.length || 0
      const maxStudents =  1050

      // Calculate revenue (mock calculation)
      const revenue = enrolledStudents * 500

      // Mock rating calculation
      const rating = Math.random() * 2 + 3 // Random rating between 3-5

      // Determine status
      let status: "active" | "inactive" | "upcoming" = "inactive"
      if (activeSemesterCourse) {
        status = "active"
      } else if (course.semesterCourse.some((sc) => sc.status === "UPCOMING")) {
        status = "upcoming"
      }

      return {
        id: course.id,
        name: course.name,
        code: course.code,
        instructor: course.semesterCourse[0].instructor ? `${course.semesterCourse[0].instructor.firstName} ${course.semesterCourse[0].instructor.lastName}` : "Unassigned",
        enrolledStudents,
        maxStudents,
        status,
        revenue,
        rating: Number(rating.toFixed(1)),
        createdDate: course.createdAt.toISOString(),
      }
    })

    return { success: true, data: dashboardCourses }
  } catch (error) {
    console.error("Error fetching course management data:", error)
    return { success: false, error: "Failed to fetch course data" }
  }
}

export async function getSystemHealth(): Promise<{ success: boolean; data?: SystemHealth; error?: string }> {
  try {
    // Mock system health data - in a real application, you'd get this from system monitoring tools
    const systemHealth: SystemHealth = {
      cpu: Math.floor(Math.random() * 30) + 20, // 20-50% CPU usage
      memory: Math.floor(Math.random() * 40) + 30, // 30-70% memory usage
      storage: Math.floor(Math.random() * 20) + 40, // 40-60% storage usage
      network: 100, // Network is healthy
      database: 100, // Database is healthy
      uptime: "99.9%",
      lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    }

    return { success: true, data: systemHealth }
  } catch (error) {
    console.error("Error fetching system health:", error)
    return { success: false, error: "Failed to fetch system health" }
  }
}

export async function getAnalytics(): Promise<{ success: boolean; data?: Analytics; error?: string }> {
  try {
    // Get user growth data for the last 6 months
    const userGrowth = []
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0)
      monthEnd.setHours(23, 59, 59, 999)

      const [studentCount, teacherCount] = await Promise.all([
        prisma.student.count({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        }),
        prisma.teacher.count({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        }),
      ])

      userGrowth.push({
        month: months[5 - i],
        students: studentCount,
        teachers: teacherCount,
      })
    }

    // Get course popularity
    const coursePopularity = await prisma.course.findMany({
      include: {
        semesterCourse: {
          include: {
            enrollments: {
              where: { status: "active" },
            },
          },
        },
      },
      take: 10,
    })

    const popularCourses = coursePopularity
      .map((course) => ({
        name: course.name,
        enrollments: course.semesterCourse.reduce((total, sc) => total + sc.enrollments.length, 0),
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5)

    // Mock revenue data
    const revenueData = months.map((month, index) => ({
      month,
      revenue: Math.floor(Math.random() * 50000) + 30000, // Random revenue between 30k-80k
    }))

    // Mock engagement metrics
    const engagementMetrics = {
      dailyActiveUsers: Math.floor(Math.random() * 500) + 200,
      weeklyActiveUsers: Math.floor(Math.random() * 1500) + 800,
      monthlyActiveUsers: Math.floor(Math.random() * 3000) + 2000,
      averageSessionTime: Math.floor(Math.random() * 30) + 15, // 15-45 minutes
    }

    const analytics: Analytics = {
      userGrowth,
      coursePopularity: popularCourses,
      revenueData,
      engagementMetrics,
    }

    return { success: true, data: analytics }
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return { success: false, error: "Failed to fetch analytics data" }
  }
}

export async function createUser(data: z.infer<typeof UserCreateSchema>) {
  
}

export async function updateUser(data: z.infer<typeof UserUpdateSchema>) {
  try {
    const validatedData = UserUpdateSchema.parse(data)

    // Determine which table to update based on the user ID
    // This is a simplified approach - you might want to add a user type field
    let updatedUser

    // Try to update in each table
    try {
      updatedUser = await prisma.student.update({
        where: { id: validatedData.id },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          phoneNumber: validatedData.phoneNumber || "",
          status: validatedData.status,
        },
      })
    } catch {
      try {
        updatedUser = await prisma.teacher.update({
          where: { id: validatedData.id },
          data: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            phoneNumber: validatedData.phoneNumber || "",
            status: validatedData.status,
          },
        })
      } catch {
        updatedUser = await prisma.admin.update({
          where: { id: validatedData.id },
          data: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            phoneNumber: validatedData.phoneNumber || "",
            status: validatedData.status,
          },
        })
      }
    }

    revalidatePath("/admin/dashboard")
    return { success: true, data: updatedUser }
  } catch (error) {
    console.error("Error updating user:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", details: error.errors }
    }
    return { success: false, error: "Failed to update user" }
  }
}

export async function deleteUser(userId: string, userType: "student" | "teacher" | "admin") {
  try {
    let deletedUser

    switch (userType) {
      case "student":
        deletedUser = await prisma.student.update({
          where: { id: userId },
          data: { status: "inactive" },
        })
        break

      case "teacher":
        deletedUser = await prisma.teacher.update({
          where: { id: userId },
          data: { status: "inactive" },
        })
        break

      case "admin":
        deletedUser = await prisma.admin.update({
          where: { id: userId },
          data: { status: "inactive" },
        })
        break

      default:
        return { success: false, error: "Invalid user type" }
    }

    revalidatePath("/admin/dashboard")
    return { success: true, data: deletedUser }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error: "Failed to delete user" }
  }
}

export async function createCourse(data: z.infer<typeof CourseCreateSchema>) {
  
}

export async function getTeachersForDropdown() {
  try {
    const teachers = await prisma.teacher.findMany({
      where: { status: "active" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      orderBy: { firstName: "asc" },
    })

    const teacherOptions = teachers.map((teacher) => ({
      value: teacher.id,
      label: `${teacher.firstName} ${teacher.lastName}`,
    }))

    return { success: true, data: teacherOptions }
  } catch (error) {
    console.error("Error fetching teachers:", error)
    return { success: false, error: "Failed to fetch teachers" }
  }
}

export async function getDepartmentsForDropdown() {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    })

    const departmentOptions = departments.map((dept) => ({
      value: dept.id,
      label: dept.name,
    }))

    return { success: true, data: departmentOptions }
  } catch (error) {
    console.error("Error fetching departments:", error)
    return { success: false, error: "Failed to fetch departments" }
  }
}

export async function performSystemAction(action: "backup" | "clear_cache" | "security_scan" | "export_logs") {
  try {
    // Mock system actions - in a real application, these would perform actual system operations
    let result

    switch (action) {
      case "backup":
        // Simulate database backup
        await new Promise((resolve) => setTimeout(resolve, 2000))
        result = { message: "Database backup completed successfully" }
        break

      case "clear_cache":
        // Simulate cache clearing
        await new Promise((resolve) => setTimeout(resolve, 1000))
        result = { message: "Cache cleared successfully" }
        break

      case "security_scan":
        // Simulate security scan
        await new Promise((resolve) => setTimeout(resolve, 3000))
        result = { message: "Security scan completed - no issues found" }
        break

      case "export_logs":
        // Simulate log export
        await new Promise((resolve) => setTimeout(resolve, 1500))
        result = { message: "System logs exported successfully" }
        break

      default:
        return { success: false, error: "Invalid system action" }
    }

    return { success: true, data: result }
  } catch (error) {
    console.error("Error performing system action:", error)
    return { success: false, error: "Failed to perform system action" }
  }
}

export async function exportDashboardData() {
  try {
    const [stats, users, courses, activities] = await Promise.all([
      getSystemStats(),
      getUserManagement(),
      getCourseManagement(),
      getRecentActivities(),
    ])

    const exportData = {
      generatedAt: new Date().toISOString(),
      systemStats: stats.success ? stats.data : null,
      users: users.success ? users.data : null,
      courses: courses.success ? courses.data : null,
      recentActivities: activities.success ? activities.data : null,
    }

    return { success: true, data: exportData }
  } catch (error) {
    console.error("Error exporting dashboard data:", error)
    return { success: false, error: "Failed to export dashboard data" }
  }
}
