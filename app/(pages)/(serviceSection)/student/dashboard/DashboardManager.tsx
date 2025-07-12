"use client"

import { useEffect, useState } from "react"
import { getStudentDashboardData, getStudentStats } from "@/app/actions/student/dashboard.action"
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Bell,
  TrendingUp,
  User,
  Award,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Users,
  Star,
  Target,
  BookMarked,
  ClipboardList,
  MessageSquare,
  ChevronRight,
  BarChart3,
  Zap,
  Timer,
} from "lucide-react"

interface DashboardData {
  student: any
  enrolledCourses: any[]
  upcomingAssignments: any[]
  recentAnnouncements: any[]
  upcomingExams: any[]
  recentGrades: any[]
  calendarEvents: any[]
}

interface Stats {
  totalCourses: number
  pendingAssignments: number
  upcomingExams: number
}

export default function StudentDashboard({ studentId = "student_id_here" }: { studentId?: string }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [data, statsData] = await Promise.all([getStudentDashboardData(studentId), getStudentStats(studentId)])
        setDashboardData(data)
        setStats(statsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [studentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-purple-400 animate-spin animation-delay-150 mx-auto"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading your dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Preparing your academic overview</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  const {
    student,
    enrolledCourses,
    upcomingAssignments,
    recentAnnouncements,
    upcomingExams,
    recentGrades,
    calendarEvents,
  } = dashboardData

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case "A":
        return "text-green-600 bg-green-100"
      case "B":
        return "text-blue-600 bg-blue-100"
      case "C":
        return "text-yellow-600 bg-yellow-100"
      case "D":
        return "text-orange-600 bg-orange-100"
      default:
        return "text-red-600 bg-red-100"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600 bg-red-100 border-red-200"
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-100 border-yellow-200"
      default:
        return "text-gray-600 bg-gray-100 border-gray-200"
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "EXAM":
        return <GraduationCap className="w-4 h-4" />
      case "ASSIGNMENT":
        return <FileText className="w-4 h-4" />
      case "CLASS":
        return <BookOpen className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {student.firstName[0]}
                    {student.lastName[0]}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold  text-gray-800 ">
                    Welcome back, {student.firstName}! 👋
                  </h1>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-gray-600 flex items-center">
                      <GraduationCap className="w-4 h-4 mr-1" />
                      {student.program?.name}
                    </p>
                    <p className="text-gray-500 flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {student.matriculationNumber}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      student.status === "active"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        student.status === "active" ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    {student.status}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-white/20 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-shadow">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
                    </div>
                  </div>
                </div>
                <div className="text-blue-500">
                  <BarChart3 className="w-8 h-8 opacity-20" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                Active semester
              </div>
            </div>

            <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-white/20 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg group-hover:shadow-yellow-500/25 transition-shadow">
                      <ClipboardList className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Assignments</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.pendingAssignments}</p>
                    </div>
                  </div>
                </div>
                <div className="text-yellow-500">
                  <Timer className="w-8 h-8 opacity-20" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-yellow-600">
                <Clock className="w-4 h-4 mr-1" />
                Due soon
              </div>
            </div>

            <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-white/20 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl shadow-lg group-hover:shadow-red-500/25 transition-shadow">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Upcoming Exams</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.upcomingExams}</p>
                    </div>
                  </div>
                </div>
                <div className="text-red-500">
                  <Zap className="w-8 h-8 opacity-20" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-red-600">
                <Target className="w-4 h-4 mr-1" />
                Scheduled
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enrolled Courses */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookMarked className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {enrolledCourses.length} enrolled
                </span>
              </div>
            </div>
            <div className="p-6">
              {enrolledCourses.length > 0 ? (
                <div className="space-y-4">
                  {enrolledCourses.map((enrollment, index) => (
                    <div
                      key={enrollment.id}
                      className="group border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200 bg-white/50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {enrollment.semesterCourse.course.name}
                            </h3>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 flex items-center">
                              <BookOpen className="w-4 h-4 mr-1" />
                              {enrollment.semesterCourse.course.code} • {enrollment.semesterCourse.course.credits}{" "}
                              credits
                            </p>
                            <p className="text-sm text-gray-500 flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {enrollment.semesterCourse.instructor.firstName}{" "}
                              {enrollment.semesterCourse.instructor.lastName}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              enrollment.status === "active"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : "bg-gray-100 text-gray-800 border border-gray-200"
                            }`}
                          >
                            {enrollment.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No enrolled courses</p>
                  <p className="text-sm text-gray-400 mt-1">Start your academic journey</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <FileText className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Upcoming Assignments</h2>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {upcomingAssignments.length} pending
                </span>
              </div>
            </div>
            <div className="p-6">
              {upcomingAssignments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="group border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-yellow-200 transition-all duration-200 bg-white/50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">
                              {assignment.title}
                            </h3>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 flex items-center">
                              <BookOpen className="w-4 h-4 mr-1" />
                              {assignment.semesterCourse.course.name}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className="text-sm font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-lg">
                            {assignment.totalPoints} pts
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">All caught up!</p>
                  <p className="text-sm text-gray-400 mt-1">No pending assignments</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Announcements</h2>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {recentAnnouncements.length} new
                </span>
              </div>
            </div>
            <div className="p-6">
              {recentAnnouncements.length > 0 ? (
                <div className="space-y-4">
                  {recentAnnouncements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="group border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-purple-200 transition-all duration-200 bg-white/50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Bell className="w-4 h-4 text-purple-500" />
                            <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                              {announcement.title}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{announcement.content}</p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {announcement.semesterCourse.course.name}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(
                            announcement.priority,
                          )}`}
                        >
                          {announcement.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No recent announcements</p>
                  <p className="text-sm text-gray-400 mt-1">Stay tuned for updates</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Grades */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Grades</h2>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {recentGrades.length} grades
                </span>
              </div>
            </div>
            <div className="p-6">
              {recentGrades.length > 0 ? (
                <div className="space-y-4">
                  {recentGrades.map((grade) => (
                    <div
                      key={grade.id}
                      className="group border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-green-200 transition-all duration-200 bg-white/50"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Star className="w-4 h-4 text-green-500" />
                            <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                              {grade.semesterCourse.course.name}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600">{grade.semesterCourse.course.code}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${getGradeColor(grade.grade)}`}>
                            {grade.grade}
                          </span>
                          {grade.percentage && (
                            <p className="text-sm text-gray-600 mt-1 font-medium">{grade.percentage}%</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No grades available</p>
                  <p className="text-sm text-gray-400 mt-1">Grades will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Events */}
        {calendarEvents.length > 0 && (
          <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
                  <span className="text-sm text-gray-500 bg-indigo-100 px-2 py-1 rounded-full">Next 7 days</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calendarEvents.map((event) => (
                  <div
                    key={event.id}
                    className="group border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-indigo-200 transition-all duration-200 bg-white/50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="p-1 bg-indigo-100 rounded">{getEventTypeIcon(event.type)}</div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {event.title}
                          </h3>
                        </div>
                        {event.description && <p className="text-sm text-gray-600 mb-2">{event.description}</p>}
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(event.date).toLocaleDateString()} at {event.time}
                          </p>
                          {event.location && (
                            <p className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          event.type === "EXAM"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : event.type === "ASSIGNMENT"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : event.type === "CLASS"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-gray-100 text-gray-800 border border-gray-200"
                        }`}
                      >
                        {event.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
