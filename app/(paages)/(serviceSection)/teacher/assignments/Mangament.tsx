"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignmentStatus,
  gradeSubmission,
  getAssignmentStats,
  type Assignment,
  type Submission,
} from "@/app/actions/teacher/assigment.action"
import { verifyAuthSession } from "@/app/sessions/authSession"
import { redirect } from "next/navigation"

export default function TeacherAssignments({teacherId}:{teacherId:string}) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [activeTab, setActiveTab] = useState<"details" | "submissions" | "grading">("details")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGradingModal, setShowGradingModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAssignments: 0,
    publishedAssignments: 0,
    pendingGrading: 0,
    totalSubmissions: 0,
  })
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    course: "",
    courseCode: "",
    dueDate: "",
    dueTime: "",
    totalPoints: 100,
    instructions: [""],
    allowLateSubmissions: true,
    semesterCourseId: "default-semester-course-id", // This should come from context or props
  })

  // Load assignments and stats on component mount
  useEffect(() => {
    loadAssignments()
    loadStats()
  }, [searchTerm, filterStatus])

  const loadAssignments = async () => {
    setLoading(true) // This should come from auth context
    const result = await getAssignments(teacherId, {
      search: searchTerm,
      status: filterStatus,
    })

    if (result.success) {
      setAssignments(result.assignments || [])
    } else {
      console.error("Failed to load assignments:", result.error)
    }
    setLoading(false)
  }

  const loadStats = async () => {
    const session = verifyAuthSession()
    
    const result = await getAssignmentStats(teacherId)

    if (result.success) {
      setStats(result.stats!)
    }
  }

  const loadAssignmentDetails = async (assignmentId: string) => {
    const result = await getAssignmentById(assignmentId)
    if (result.success) {
      setSelectedAssignment(result.assignment as any)
    }
  }

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || assignment.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "published":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "graded":
        return "bg-green-100 text-green-800"
      case "late":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await createAssignment(assignmentForm)

    if (result.success) {
      setShowCreateModal(false)
      resetForm()
      loadAssignments()
      loadStats()
    } else {
      console.error("Failed to create assignment:", result.error)
      // You might want to show a toast notification here
    }
  }

  const handleUpdateAssignmentStatus = async (assignmentId: string, status: "DRAFT" | "ACTIVE" | "CLOSED") => {
    const result = await updateAssignmentStatus(assignmentId, status)

    if (result.success) {
      loadAssignments()
      if (selectedAssignment?.id === assignmentId) {
        setSelectedAssignment(result.assignment as any)
      }
    }
  }

  const resetForm = () => {
    setAssignmentForm({
      title: "",
      description: "",
      course: "",
      courseCode: "",
      dueDate: "",
      dueTime: "",
      totalPoints: 100,
      instructions: [""],
      allowLateSubmissions: true,
      semesterCourseId: "default-semester-course-id",
    })
  }

  const addInstruction = () => {
    setAssignmentForm((prev) => ({
      ...prev,
      instructions: [...prev.instructions, ""],
    }))
  }

  const updateInstruction = (index: number, value: string) => {
    setAssignmentForm((prev) => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => (i === index ? value : inst)),
    }))
  }

  const removeInstruction = (index: number) => {
    setAssignmentForm((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index),
    }))
  }

  const handleGradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    const teacherId = "current-teacher-id" // This should come from auth context
    const result = await gradeSubmission({
      submissionId,
      grade,
      feedback,
      gradedBy: teacherId,
    })

    if (result.success) {
      setShowGradingModal(false)
      setSelectedSubmission(null)
      // Reload assignment details to get updated submissions
      if (selectedAssignment) {
        loadAssignmentDetails(selectedAssignment.id)
      }
      loadStats()
    } else {
      console.error("Failed to grade submission:", result.error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
            <p className="text-gray-600">Create and manage course assignments</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Assignment</span>
          </button>
        </div>

        {!selectedAssignment ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Published</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.publishedAssignments}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Grading</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingGrading}</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    placeholder="Search assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Assignments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                  onClick={() => {
                    setSelectedAssignment(assignment)
                    loadAssignmentDetails(assignment.id)
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                        <p className="text-sm text-gray-600">
                          {assignment.courseCode} • {assignment.course}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}
                        >
                          {assignment.status}
                        </span>
                        {assignment.status === "draft" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateAssignmentStatus(assignment.id, "ACTIVE")
                            }}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{assignment.description}</p>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Due: {assignment.dueDate} at {assignment.dueTime}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        {assignment.totalPoints} points
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">{assignment.submissions.length} submissions</div>
                      <div className="text-sm text-gray-600">
                        {assignment.submissions.filter((s) => s.status === "submitted").length} pending
                      </div>
                    </div>
                    {assignment.submissions.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Graded</span>
                          <span className="font-medium text-gray-900">
                            {assignment.submissions.filter((s) => s.status === "graded").length}/
                            {assignment.submissions.length}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(assignment.submissions.filter((s) => s.status === "graded").length / assignment.submissions.length) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Assignment Detail View - Keep the existing detail view code but add status update functionality */
          <div className="space-y-6">
            {/* Assignment Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <button onClick={() => setSelectedAssignment(null)} className="p-2 hover:bg-gray-100 rounded-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedAssignment.title}</h1>
                    <p className="text-gray-600">
                      {selectedAssignment.courseCode} • {selectedAssignment.course}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedAssignment.status)}`}
                  >
                    {selectedAssignment.status}
                  </span>
                  <div className="flex space-x-2">
                    {selectedAssignment.status === "draft" && (
                      <button
                        onClick={() => handleUpdateAssignmentStatus(selectedAssignment.id, "ACTIVE")}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Publish
                      </button>
                    )}
                    {selectedAssignment.status === "published" && (
                      <button
                        onClick={() => handleUpdateAssignmentStatus(selectedAssignment.id, "CLOSED")}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Close
                      </button>
                    )}
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                      Edit Assignment
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedAssignment.totalPoints}</div>
                  <div className="text-sm text-gray-600">Total Points</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedAssignment.submissions.length}</div>
                  <div className="text-sm text-gray-600">Submissions</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedAssignment.submissions.filter((s) => s.status === "submitted").length}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedAssignment.submissions.filter((s) => s.status === "graded").length}
                  </div>
                  <div className="text-sm text-gray-600">Graded</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: "details", label: "Details" },
                    { id: "submissions", label: "Submissions" },
                    { id: "grading", label: "Grading" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="p-6">
                {activeTab === "details" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-600">{selectedAssignment.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Due Date:</span>
                            <span className="text-sm font-medium">
                              {selectedAssignment.dueDate} at {selectedAssignment.dueTime}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Points:</span>
                            <span className="text-sm font-medium">{selectedAssignment.totalPoints}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Late Submissions:</span>
                            <span className="text-sm font-medium">
                              {selectedAssignment.allowLateSubmissions ? "Allowed" : "Not Allowed"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Created:</span>
                            <span className="text-sm font-medium">{selectedAssignment.createdAt}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
                        <ol className="space-y-2">
                          {selectedAssignment.instructions.map((instruction, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-blue-600 font-medium">{index + 1}.</span>
                              <span className="text-sm text-gray-600">{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                    {selectedAssignment.attachments.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
                        <div className="space-y-2">
                          {selectedAssignment.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded">
                              <svg
                                className="w-4 h-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                />
                              </svg>
                              <span className="text-sm text-gray-700">{attachment}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "submissions" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Submissions ({selectedAssignment.submissions.length})
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {selectedAssignment.submissions.map((submission) => (
                        <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{submission.studentName}</h4>
                              <p className="text-sm text-gray-600">Submitted: {submission.submittedAt}</p>
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">Files:</p>
                                <ul className="list-disc list-inside text-sm text-gray-500">
                                  {submission.files.map((file, index) => (
                                    <li key={index}>{file}</li>
                                  ))}
                                </ul>
                              </div>
                              {submission.grade !== undefined && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-900">
                                    Grade: {submission.grade}/{selectedAssignment.totalPoints}
                                  </p>
                                  {submission.feedback && (
                                    <p className="text-sm text-gray-600">Feedback: {submission.feedback}</p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubmissionStatusColor(submission.status)}`}
                              >
                                {submission.status}
                              </span>
                              {submission.status === "submitted" && (
                                <button
                                  onClick={() => {
                                    setSelectedSubmission(submission)
                                    setShowGradingModal(true)
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
                                >
                                  Grade
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === "grading" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Grading Overview</h3>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedAssignment.submissions.filter((s) => s.grade !== undefined).length > 0
                            ? Math.round(
                                selectedAssignment.submissions
                                  .filter((s) => s.grade !== undefined)
                                  .reduce((acc, s) => acc + (s.grade || 0), 0) /
                                  selectedAssignment.submissions.filter((s) => s.grade !== undefined).length,
                              )
                            : 0}
                        </div>
                        <div className="text-sm text-gray-600">Average Grade</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedAssignment.submissions.filter((s) => s.status === "graded").length}
                        </div>
                        <div className="text-sm text-gray-600">Graded</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedAssignment.submissions.filter((s) => s.status === "submitted").length}
                        </div>
                        <div className="text-sm text-gray-600">Pending</div>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      Detailed grading analytics and grade distribution would be displayed here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Assignment Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Create New Assignment</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      resetForm()
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title</label>
                    <input
                      type="text"
                      value={assignmentForm.title}
                      onChange={(e) => setAssignmentForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter assignment title"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={assignmentForm.description}
                      onChange={(e) => setAssignmentForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter assignment description"
                      rows={3}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                      <input
                        type="text"
                        value={assignmentForm.course}
                        onChange={(e) => setAssignmentForm((prev) => ({ ...prev, course: e.target.value }))}
                        placeholder="Course name"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                      <input
                        type="text"
                        value={assignmentForm.courseCode}
                        onChange={(e) => setAssignmentForm((prev) => ({ ...prev, courseCode: e.target.value }))}
                        placeholder="CS301"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={assignmentForm.dueDate}
                        onChange={(e) => setAssignmentForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Time</label>
                      <input
                        type="time"
                        value={assignmentForm.dueTime}
                        onChange={(e) => setAssignmentForm((prev) => ({ ...prev, dueTime: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Points</label>
                      <input
                        type="number"
                        value={assignmentForm.totalPoints}
                        onChange={(e) =>
                          setAssignmentForm((prev) => ({ ...prev, totalPoints: Number.parseInt(e.target.value) }))
                        }
                        min="1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                    <div className="space-y-2">
                      {assignmentForm.instructions.map((instruction, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={instruction}
                            onChange={(e) => updateInstruction(index, e.target.value)}
                            placeholder={`Instruction ${index + 1}`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {assignmentForm.instructions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeInstruction(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addInstruction}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        + Add Instruction
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowLate"
                      checked={assignmentForm.allowLateSubmissions}
                      onChange={(e) =>
                        setAssignmentForm((prev) => ({ ...prev, allowLateSubmissions: e.target.checked }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allowLate" className="ml-2 block text-sm text-gray-700">
                      Allow late submissions
                    </label>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                    >
                      Create Assignment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false)
                        resetForm()
                      }}
                      className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Grading Modal */}
        {showGradingModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Grade Submission</h2>
                  <button
                    onClick={() => {
                      setShowGradingModal(false)
                      setSelectedSubmission(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      Student: <span className="font-medium">{selectedSubmission.studentName}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Submitted: <span className="font-medium">{selectedSubmission.submittedAt}</span>
                    </p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.target as HTMLFormElement)
                      const grade = Number.parseInt(formData.get("grade") as string)
                      const feedback = formData.get("feedback") as string
                      handleGradeSubmission(selectedSubmission.id, grade, feedback)
                    }}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grade (out of {selectedAssignment?.totalPoints})
                        </label>
                        <input
                          type="number"
                          name="grade"
                          min="0"
                          max={selectedAssignment?.totalPoints}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                        <textarea
                          name="feedback"
                          rows={4}
                          placeholder="Enter feedback for the student..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                        >
                          Submit Grade
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowGradingModal(false)
                            setSelectedSubmission(null)
                          }}
                          className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
