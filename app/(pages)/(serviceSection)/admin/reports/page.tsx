"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Calendar,
  Search,
  MoreHorizontal,
  UserCheck,
  Building,
  ChevronDown,
  Loader2,
} from "lucide-react"
import {
  getOverviewStats,
  getEnrollmentData,
  getDepartmentData,
  getPerformanceData,
  getRecentStudents,
  getDepartmentOptions,
  searchStudents,
  exportReportData,
} from "@/app/actions/admin/report.action"

interface OverviewStat {
  title: string
  value: string
  change: string
  icon: any
  trend: "up" | "down"
}

interface EnrollmentDataPoint {
  month: string
  students: number
  newEnrollments: number
}

interface DepartmentDataPoint {
  name: string
  students: number
  color: string
}

interface PerformanceDataPoint {
  semester: string
  gpa: number
  completion: number
}

interface Student {
  id: string
  name: string
  department: string
  gpa: number
  status: string
  email?: string
}

interface DepartmentOption {
  value: string
  label: string
}

export default function AdminReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("semester")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [activeTab, setActiveTab] = useState("enrollment")
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [overviewStats, setOverviewStats] = useState<OverviewStat[]>([])
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentDataPoint[]>([])
  const [departmentData, setDepartmentData] = useState<DepartmentDataPoint[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([])
  const [recentStudents, setRecentStudents] = useState<Student[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([])
  const [searchResults, setSearchResults] = useState<Student[]>([])

  const periodOptions = [
    { value: "semester", label: "Current Semester" },
    { value: "year", label: "Academic Year" },
    { value: "quarter", label: "Quarter" },
  ]

  const tabs = [
    { id: "enrollment", label: "Enrollment" },
    { id: "performance", label: "Performance" },
    { id: "departments", label: "Departments" },
    { id: "students", label: "Students" },
  ]

  // Load initial data
  useEffect(() => {
    loadAllData()
    loadDepartmentOptions()
  }, [selectedPeriod, selectedDepartment])

  // Handle search
  useEffect(() => {
    if (searchQuery.length >= 2) {
      handleSearch()
    } else {
      setSearchResults([])
    }
  }, [searchQuery, selectedDepartment])

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters = {
        period: selectedPeriod as "semester" | "year" | "quarter",
        department: selectedDepartment,
      }

      const [overviewResult, enrollmentResult, departmentResult, performanceResult, studentsResult] = await Promise.all(
        [
          getOverviewStats(filters),
          getEnrollmentData(filters),
          getDepartmentData(filters),
          getPerformanceData(filters),
          getRecentStudents(filters),
        ],
      )

      if (overviewResult.success) {
        const stats = [
          {
            title: "Total Students",
            value: overviewResult?.data?.totalStudents.value || '',
            change: overviewResult?.data?.totalStudents.change || '',
            icon: Users,
            trend: overviewResult?.data?.totalStudents.trend || '',
          },
          {
            title: "Active Courses",
            value: overviewResult?.data?.activeCourses.value,
            change: overviewResult?.data?.activeCourses.change,
            icon: BookOpen,
            trend: overviewResult?.data?.activeCourses.trend,
          },
          {
            title: "Faculty Members",
            value: overviewResult?.data?.facultyMembers.value,
            change: overviewResult?.data?.facultyMembers.change,
            icon: UserCheck,
            trend: overviewResult?.data?.facultyMembers.trend,
          },
          {
            title: "Graduation Rate",
            value: overviewResult?.data?.graduationRate.value,
            change: overviewResult?.data?.graduationRate.change,
            icon: GraduationCap,
            trend: overviewResult?.data?.graduationRate.trend,
          },
        ]
        setOverviewStats(stats as any)
      }

      if (enrollmentResult.success) {
        setEnrollmentData(enrollmentResult.data as any)
      }

      if (departmentResult.success) {
        setDepartmentData(departmentResult.data as any)
      }

      if (performanceResult.success) {
        setPerformanceData(performanceResult.data as any)
      }

      if (studentsResult.success) {
        setRecentStudents(studentsResult.data as any)
      }

      // Check for any errors
      const errors = [overviewResult, enrollmentResult, departmentResult, performanceResult, studentsResult]
        .filter((result) => !result.success)
        .map((result) => result.error)

      if (errors.length > 0) {
        setError(errors.join(", "))
      }
    } catch (err) {
      setError("Failed to load report data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadDepartmentOptions = async () => {
    try {
      const result = await getDepartmentOptions()
      if (result.success) {
        setDepartmentOptions(result.data as any)
      }
    } catch (err) {
      console.error("Failed to load department options:", err)
    }
  }

  const handleSearch = async () => {
    try {
      const result = await searchStudents(searchQuery, {
        period: selectedPeriod as "semester" | "year" | "quarter",
        department: selectedDepartment,
      })

      if (result.success) {
        setSearchResults(result.data as any)
      }
    } catch (err) {
      console.error("Search failed:", err)
    }
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      const result = await exportReportData({
        period: selectedPeriod as "semester" | "year" | "quarter",
        department: selectedDepartment,
      })

      if (result.success) {
        // Create and download the file
        const dataStr = JSON.stringify(result.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: "application/json" })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = `admin-report-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        setError(result.error || "Export failed")
      }
    } catch (err) {
      setError("Export failed")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading && overviewStats.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">University Portal - Admin Reports</h1>
              <p className="text-gray-600 mt-1">Comprehensive analytics and reporting dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </button>
              <button className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
              <button
                onClick={handleExport}
                disabled={loading}
                className="flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <span className="sr-only">Close</span>×
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
          {/* Period Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center justify-between w-48 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {periodOptions.find((option) => option.value === selectedPeriod)?.label}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            {showPeriodDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedPeriod(option.value)
                      setShowPeriodDropdown(false)
                    }}
                    className="block w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Department Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
              className="flex items-center justify-between w-48 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {departmentOptions.find((option) => option.value === selectedDepartment)?.label || "All Departments"}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            {showDepartmentDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {departmentOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedDepartment(option.value)
                      setShowDepartmentDropdown(false)
                    }}
                    className="block w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search students, courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                {searchResults.map((student) => (
                  <div key={student.id} className="px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <div className="font-medium text-sm">{student.name}</div>
                    <div className="text-xs text-gray-500">
                      {student.department} • GPA: {student.gpa}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overviewStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                <stat.icon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className={`flex items-center text-xs ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {stat.trend === "up" ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {stat.change} from last period
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-600"></div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Enrollment Tab */}
            {activeTab === "enrollment" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Enrollment Trend</h3>
                    <p className="text-sm text-gray-600 mb-4">Monthly enrollment numbers over the past 6 months</p>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={enrollmentData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="students"
                            stroke="#7c3aed"
                            strokeWidth={2}
                            dot={{ fill: "#7c3aed" }}
                            name="Total Students"
                          />
                          <Line
                            type="monotone"
                            dataKey="newEnrollments"
                            stroke="#a855f7"
                            strokeWidth={2}
                            dot={{ fill: "#a855f7" }}
                            name="New Enrollments"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Enrollment by Department</h3>
                    <p className="text-sm text-gray-600 mb-4">Current student distribution across departments</p>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={departmentData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="students"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {departmentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === "performance" && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Academic Performance Trends</h3>
                <p className="text-sm text-gray-600 mb-4">Average GPA and course completion rates by semester</p>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="semester" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="gpa" fill="#7c3aed" radius={4} name="Average GPA" />
                      <Bar dataKey="completion" fill="#a855f7" radius={4} name="Completion Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Departments Tab */}
            {activeTab === "departments" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departmentData.map((dept, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900">{dept.name}</h3>
                      <Building className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{dept.students.toLocaleString()}</div>
                    <p className="text-xs text-gray-600 mb-4">Active Students</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Faculty</span>
                        <span className="font-medium text-gray-900">{Math.floor(dept.students / 50)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Courses</span>
                        <span className="font-medium text-gray-900">{Math.floor(dept.students / 100)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Students Tab */}
            {activeTab === "students" && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Student Records</h3>
                <p className="text-sm text-gray-600 mb-4">Latest student enrollments and status updates</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          GPA
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.department}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                student.gpa >= 3.5 ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {student.gpa}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                student.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {student.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
