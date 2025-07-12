"use client"

import { useState, useEffect, useTransition } from "react"
import type React from "react"
import {
  getSystemStats,
  getRecentActivities,
  getUserManagement,
  getCourseManagement,
  getSystemHealth,
  getAnalytics,
  getTeachersForDropdown,
  getDepartmentsForDropdown,
  performSystemAction,
  exportDashboardData,
} from "@/app/actions/admin/dashboard.action"
import { toast } from "sonner"
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Settings,
  BarChart3,
  PieChart,
  Calendar,
  FileText,
  Mail,
  Shield,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  X,
  Loader2,
} from "lucide-react"

// Import types from the actions file
import type {
  SystemStats,
  RecentActivity,
  DashboardUser,
  DashboardCourse,
  SystemHealth,
  Analytics,
} from "@/app/actions/admin/dashboard.action"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "courses" | "analytics" | "system">("overview")
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [users, setUsers] = useState<DashboardUser[]>([])
  const [courses, setCourses] = useState<DashboardCourse[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Search and filter states
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "student" | "teacher" | "admin">("all")
  const [courseSearchTerm, setCourseSearchTerm] = useState("")
  const [courseStatusFilter, setCourseStatusFilter] = useState<"all" | "active" | "inactive" | "upcoming">("all")

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<DashboardCourse | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")

  // Form states
  const [userFormData, setUserFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "student" as "student" | "teacher" | "admin",
    phoneNumber: "",
    password: "",
    status: "active" as "active" | "inactive" | "suspended",
  })

  const [courseFormData, setCourseFormData] = useState({
    name: "",
    code: "",
    description: "",
    credits: 3,
    maxStudents: 50,
    teacherId: "",
    departmentId: "",
  })

  // Dropdown options
  const [teacherOptions, setTeacherOptions] = useState<Array<{ value: string; label: string }>>([])
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ value: string; label: string }>>([])

  // Load initial data
  useEffect(() => {
    loadDashboardData()
    loadDropdownOptions()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [statsResult, activitiesResult, usersResult, coursesResult, healthResult, analyticsResult] =
        await Promise.all([
          getSystemStats(),
          getRecentActivities(),
          getUserManagement(),
          getCourseManagement(),
          getSystemHealth(),
          getAnalytics(),
        ])

      if (statsResult.success) setSystemStats(statsResult.data!)
      if (activitiesResult.success) setRecentActivities(activitiesResult.data || [])
      if (usersResult.success) setUsers(usersResult.data || [])
      if (coursesResult.success) setCourses(coursesResult.data || [])
      if (healthResult.success) setSystemHealth(healthResult.data!)
      if (analyticsResult.success) setAnalytics(analyticsResult.data!)

      // Show errors for failed requests
      const errors = [statsResult, activitiesResult, usersResult, coursesResult, healthResult, analyticsResult]
        .filter((result) => !result.success)
        .map((result) => result.error)

      if (errors.length > 0) {
        toast.error(`Failed to load some data: ${errors.join(", ")}`)
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const loadDropdownOptions = async () => {
    try {
      const [teachersResult, departmentsResult] = await Promise.all([
        getTeachersForDropdown(),
        getDepartmentsForDropdown(),
      ])

      if (teachersResult.success) setTeacherOptions(teachersResult.data!)
      if (departmentsResult.success) setDepartmentOptions(departmentsResult.data!)
    } catch (error) {
      console.error("Error loading dropdown options:", error)
    }
  }

  // Filter functions
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    const matchesRole = userRoleFilter === "all" || user.role === userRoleFilter
    return matchesSearch && matchesRole
  })

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(courseSearchTerm.toLowerCase())
    const matchesStatus = courseStatusFilter === "all" || course.status === courseStatusFilter
    return matchesSearch && matchesStatus
  })

  // Modal handlers
  const openUserModal = (mode: "create" | "edit" | "view", user?: DashboardUser) => {
    setModalMode(mode)
    setSelectedUser(user || null)
    if (user && mode === "edit") {
      const nameParts = user.name.split(" ")
      setUserFormData({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: user.email,
        role: user.role,
        phoneNumber: "",
        password: "",
        status: user.status,
      })
    } else if (mode === "create") {
      setUserFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: "student",
        phoneNumber: "",
        password: "",
        status: "active",
      })
    }
    setShowUserModal(true)
  }

  const openCourseModal = (mode: "create" | "edit" | "view", course?: DashboardCourse) => {
    setModalMode(mode)
    setSelectedCourse(course || null)
    if (course && mode === "edit") {
      setCourseFormData({
        name: course.name,
        code: course.code,
        description: "",
        credits: 3,
        maxStudents: course.maxStudents,
        teacherId: "",
        departmentId: "",
      })
    } else if (mode === "create") {
      setCourseFormData({
        name: "",
        code: "",
        description: "",
        credits: 3,
        maxStudents: 50,
        teacherId: "",
        departmentId: "",
      })
    }
    setShowCourseModal(true)
  }

  

 

 
  const handleSystemAction = async (action: "backup" | "clear_cache" | "security_scan" | "export_logs") => {
    startTransition(async () => {
      try {
        const result = await performSystemAction(action)
        if (result.success) {
          toast.success(result.data?.message || "Action completed successfully")
        } else {
          toast.error(result.error || "Action failed")
        }
      } catch (error) {
        toast.error("Action failed")
        console.error(error)
      }
    })
  }

  const handleExportData = async () => {
    startTransition(async () => {
      try {
        const result = await exportDashboardData()
        if (result.success) {
          // Create and download the file
          const dataStr = JSON.stringify(result.data, null, 2)
          const dataBlob = new Blob([dataStr], { type: "application/json" })
          const url = URL.createObjectURL(dataBlob)
          const link = document.createElement("a")
          link.href = url
          link.download = `dashboard-export-${new Date().toISOString().split("T")[0]}.json`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          toast.success("Data exported successfully")
        } else {
          toast.error(result.error || "Export failed")
        }
      } catch (error) {
        toast.error("Export failed")
        console.error(error)
      }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "suspended":
        return "bg-yellow-100 text-yellow-800"
      case "upcoming":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "success":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "enrollment":
        return <Users className="w-4 h-4" />
      case "course_created":
        return <BookOpen className="w-4 h-4" />
      case "user_registered":
        return <GraduationCap className="w-4 h-4" />
      case "assignment_submitted":
        return <FileText className="w-4 h-4" />
      case "exam_completed":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your educational platform</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={loadDashboardData}
              disabled={isPending}
              className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportData}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "users", label: "Users", icon: Users },
                { id: "courses", label: "Courses", icon: BookOpen },
                { id: "analytics", label: "Analytics", icon: PieChart },
                { id: "system", label: "System", icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Users</p>
                        <p className="text-3xl font-bold text-gray-900">{systemStats?.totalUsers || 0}</p>
                        <p className="text-sm text-green-600">+12% from last month</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Courses</p>
                        <p className="text-3xl font-bold text-gray-900">{systemStats?.activeCourses || 0}</p>
                        <p className="text-sm text-green-600">+8% from last month</p>
                      </div>
                      <BookOpen className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Enrollments</p>
                        <p className="text-3xl font-bold text-gray-900">{systemStats?.totalEnrollments || 0}</p>
                        <p className="text-sm text-green-600">+15% from last month</p>
                      </div>
                      <GraduationCap className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Students</span>
                        <span className="font-medium">{systemStats?.totalStudents || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Teachers</span>
                        <span className="font-medium">{systemStats?.totalTeachers || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Pending Applications</span>
                        <span className="font-medium text-yellow-600">{systemStats?.pendingApplications || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Overall Health</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${systemStats?.systemHealth || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{systemStats?.systemHealth || 0}%</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">All systems operational</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Uptime: {systemHealth?.uptime || "99.9%"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Send Announcement</span>
                      </button>
                      <button
                        onClick={handleExportData}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Generate Report</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                  <div className="space-y-4">
                    {recentActivities.slice(0, 10).map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}
                        >
                          {activity.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-6">
                {/* User Management Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                    <p className="text-gray-600">Manage students, teachers, and administrators</p>
                  </div>
                  <button
                    onClick={() => openUserModal("create")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add User</span>
                  </button>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="student">Students</option>
                      <option value="teacher">Teachers</option>
                      <option value="admin">Administrators</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Activity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-gray-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="capitalize text-sm text-gray-900">{user.role}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.role === "student" && `${user.enrolledCourses || 0} courses`}
                            {user.role === "teacher" && `${user.createdCourses || 0} courses`}
                            {user.role === "admin" && "System access"}
                          </td>
                         
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === "courses" && (
              <div className="space-y-6">
                {/* Course Management Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Course Management</h2>
                    <p className="text-gray-600">Oversee all courses and their performance</p>
                  </div>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      placeholder="Search courses..."
                      value={courseSearchTerm}
                      onChange={(e) => setCourseSearchTerm(e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={courseStatusFilter}
                      onChange={(e) => setCourseStatusFilter(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="upcoming">Upcoming</option>
                    </select>
                  </div>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <div key={course.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{course.code}</p>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}
                          >
                            {course.status}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          Instructor: {course.instructor}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <GraduationCap className="w-4 h-4 mr-2" />
                          {course.enrolledStudents}/{course.maxStudents} Students
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="w-4 h-4 mr-2" />
                          Revenue: ${course.revenue.toLocaleString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Rating: {course.rating}/5.0
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Enrollment</span>
                          <span>{Math.round((course.enrolledStudents / course.maxStudents) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(course.enrolledStudents / course.maxStudents) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openCourseModal("view", course)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => openCourseModal("edit", course)}
                          className="px-3 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-md text-sm font-medium"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Analytics & Reports</h2>
                  <p className="text-gray-600">Detailed insights into platform performance</p>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Daily Active Users</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics?.engagementMetrics.dailyActiveUsers || 0}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Weekly Active Users</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics?.engagementMetrics.weeklyActiveUsers || 0}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Monthly Active Users</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics?.engagementMetrics.monthlyActiveUsers || 0}
                        </p>
                      </div>
                      <Calendar className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg Session Time</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics?.engagementMetrics.averageSessionTime || 0}m
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>
                </div>

                {/* Charts Placeholder */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">User growth chart</p>
                        <p className="text-xs text-gray-400">{analytics?.userGrowth.length || 0} months of data</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Revenue trends chart</p>
                        <p className="text-xs text-gray-400">
                          ${analytics?.revenueData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString() || 0}{" "}
                          total
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Popularity</h3>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Most popular courses</p>
                        <p className="text-xs text-gray-400">
                          {analytics?.coursePopularity.length || 0} courses tracked
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">User engagement data</p>
                        <p className="text-xs text-gray-400">
                          {analytics?.engagementMetrics.averageSessionTime || 0}min avg session
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">System Management</h2>
                  <p className="text-gray-600">Monitor system health and manage infrastructure</p>
                </div>

                {/* System Health */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900">CPU Usage</h3>
                      <Cpu className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usage</span>
                        <span>{systemHealth?.cpu || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (systemHealth?.cpu || 0) > 80
                              ? "bg-red-500"
                              : (systemHealth?.cpu || 0) > 60
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${systemHealth?.cpu || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900">Memory</h3>
                      <HardDrive className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usage</span>
                        <span>{systemHealth?.memory || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (systemHealth?.memory || 0) > 80
                              ? "bg-red-500"
                              : (systemHealth?.memory || 0) > 60
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${systemHealth?.memory || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900">Storage</h3>
                      <Database className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usage</span>
                        <span>{systemHealth?.storage || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (systemHealth?.storage || 0) > 80
                              ? "bg-red-500"
                              : (systemHealth?.storage || 0) > 60
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${systemHealth?.storage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900">Network</h3>
                      <Wifi className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Status</span>
                        <span className="text-green-600">Healthy</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Latency</span>
                        <span>12ms</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Uptime</span>
                        <span className="text-sm font-medium">{systemHealth?.uptime || "99.9%"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Backup</span>
                        <span className="text-sm font-medium">
                          {systemHealth?.lastBackup
                            ? new Date(systemHealth.lastBackup).toLocaleString()
                            : "2 hours ago"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Database Status</span>
                        <span className="text-sm font-medium text-green-600">Connected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cache Status</span>
                        <span className="text-sm font-medium text-green-600">Operational</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleSystemAction("backup")}
                        disabled={isPending}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 rounded-md flex items-center space-x-2"
                      >
                        <Database className="w-4 h-4" />
                        <span>Backup Database</span>
                        {isPending && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
                      </button>
                      <button
                        onClick={() => handleSystemAction("clear_cache")}
                        disabled={isPending}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 rounded-md flex items-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Clear Cache</span>
                      </button>
                      <button
                        onClick={() => handleSystemAction("security_scan")}
                        disabled={isPending}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 rounded-md flex items-center space-x-2"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Security Scan</span>
                      </button>
                      <button
                        onClick={() => handleSystemAction("export_logs")}
                        disabled={isPending}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 rounded-md flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export Logs</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {modalMode === "create" && "Create New User"}
                    {modalMode === "edit" && "Edit User"}
                    {modalMode === "view" && "User Details"}
                  </h2>
                  <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {modalMode === "view" && selectedUser && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <p className="mt-1 text-sm text-gray-900 capitalize">{selectedUser.role}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedUser.status)}`}
                        >
                          {selectedUser.status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Join Date</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedUser.joinDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Login</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedUser.lastLogin).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) }
              </div>
            </div>
          </div>
        )}

        {/* Course Modal */}
        {showCourseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {modalMode === "create" && "Create New Course"}
                    {modalMode === "edit" && "Edit Course"}
                    {modalMode === "view" && "Course Details"}
                  </h2>
                  <button onClick={() => setShowCourseModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {modalMode === "view" && selectedCourse && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Course Name</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedCourse.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Course Code</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedCourse.code}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Instructor</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedCourse.instructor}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCourse.status)}`}
                        >
                          {selectedCourse.status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Enrolled Students</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedCourse.enrolledStudents}/{selectedCourse.maxStudents}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Revenue</label>
                        <p className="mt-1 text-sm text-gray-900">${selectedCourse.revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Rating</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedCourse.rating}/5.0</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Created Date</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedCourse.createdDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
