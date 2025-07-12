"use client"
import { useState, useEffect, useTransition } from "react"
import type React from "react"
import {
  getCourses,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  toggleMaterialVisibility,
  createSyllabusItem,
  updateSyllabusItem,
  deleteSyllabusItem,
  createUpload,
  deleteUpload,
} from "@/app/actions/teacher/course.action"
import { UploadService } from "@/app/services/UploadService"
import { toast } from "sonner"

// Types
type Course = {
  id: string
  name: string
  code: string
  semester: string
  credits: number
  schedule: string
  room: string
  enrolledStudents: number
  status: "active" | "completed" | "upcoming"
  description: string
  syllabus: string[]
  syllabusItems: SyllabusItem[]
  assignments: Assignment[]
  announcements: Announcement[]
  materials: Material[]
  uploads: Upload[]
}

type Assignment = {
  id: string
  title: string
  description: string
  dueDate: string
  totalPoints: number
  submissions: number
  files?: string[] // Optional array of file URLs for assignment submissions
  status: "active" | "closed" | "draft"
}

type Announcement = {
  id: string
  title: string
  content: string
  date: string
  priority: "low" | "medium" | "high"
}

type Material = {
  id: string
  title: string
  description: string
  type: "file" | "link" | "video" | "document"
  category: string
  url: string
  fileName?: string
  fileSize?: string
  uploadDate: string
  isVisible: boolean
  downloadCount: number
}

type SyllabusItem = {
  id: string
  week: number
  title: string
  description: string
  topics: string[]
  readings: string[]
  assignments: string[]
  notes: string
}

type Upload = {
  id: string
  name: string
  fileName: string
  fileSize: string
  uploadDate: string
  fileType: string
  fileUrl: string
}

const materialCategories = [
  "Lecture Notes",
  "Assignments",
  "Resources",
  "Tutorials",
  "Examples",
  "Readings",
  "Videos",
  "Other",
]

export default function TeacherCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [activeTab, setActiveTab] = useState<
    "overview" | "students" | "assignments" | "announcements" | "materials" | "syllabus" | "uploads"
  >("overview")
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showSyllabusModal, setShowSyllabusModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [editingSyllabus, setEditingSyllabus] = useState<SyllabusItem | null>(null)
  const [materialFilter, setMaterialFilter] = useState<string>("all")
  const [materialSearch, setMaterialSearch] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  // Load courses on component mount
  useEffect(() => {
    const loadCourses = async () => {
      const result = await getCourses()
      if (result.success) {
        setCourses(result.data || [])
      }
    }
    loadCourses()
  }, [])

  // Update selected course when courses change
  useEffect(() => {
    if (selectedCourse) {
      const updatedCourse = courses.find((c) => c.id === selectedCourse.id)
      if (updatedCourse) {
        setSelectedCourse(updatedCourse)
      }
    }
  }, [courses, selectedCourse])

  const refreshCourses = async () => {
    const result = await getCourses()
    if (result.success) {
      setCourses(result.data || [])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "upcoming":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "document":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )
      case "video":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )
      case "link":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )
      case "document":
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )
    }
  }

  // Assignment handlers
  const handleAddAssignment = async (assignmentData: Omit<Assignment, "id" | "submissions">) => {
    if (!selectedCourse) return

    startTransition(async () => {
      const result = await createAssignment(selectedCourse.id, assignmentData)
      if (result.success) {
        await refreshCourses()
        setShowAssignmentModal(false)
      }
    })
  }

  const handleEditAssignment = async (assignmentData: Omit<Assignment, "id" | "submissions">) => {
    if (!selectedCourse || !editingAssignment) return

    startTransition(async () => {
      const result = await updateAssignment(selectedCourse.id, editingAssignment.id, assignmentData)
      if (result.success) {
        await refreshCourses()
        setEditingAssignment(null)
        setShowAssignmentModal(false)
      }
    })
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!selectedCourse) return

    startTransition(async () => {
      const result = await deleteAssignment(selectedCourse.id, assignmentId)
      if (result.success) {
        await refreshCourses()
      }
    })
  }

  // Announcement handlers
  const handleAddAnnouncement = async (announcementData: Omit<Announcement, "id" | "date">) => {
    if (!selectedCourse) return

    startTransition(async () => {
      const result = await createAnnouncement(selectedCourse.id, announcementData)
      if (result.success) {
        await refreshCourses()
        setShowAnnouncementModal(false)
      }
    })
  }

  const handleEditAnnouncement = async (announcementData: Omit<Announcement, "id" | "date">) => {
    if (!selectedCourse || !editingAnnouncement) return

    startTransition(async () => {
      const result = await updateAnnouncement(selectedCourse.id, editingAnnouncement.id, announcementData)
      if (result.success) {
        await refreshCourses()
        setEditingAnnouncement(null)
        setShowAnnouncementModal(false)
      }
    })
  }

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!selectedCourse) return

    startTransition(async () => {
      const result = await deleteAnnouncement(selectedCourse.id, announcementId)
      if (result.success) {
        await refreshCourses()
      }
    })
  }

  // Material handlers
  const handleAddMaterial = async (materialData: Omit<Material, "id" | "uploadDate" | "downloadCount">) => {
    if (!selectedCourse) return

    startTransition(async () => {
      const result = await createMaterial(selectedCourse.id, materialData)
      if (result.success) {
        await refreshCourses()
        setShowMaterialModal(false)
      }
    })
  }

  const handleEditMaterial = async (materialData: Omit<Material, "id" | "uploadDate" | "downloadCount">) => {
    if (!selectedCourse || !editingMaterial) return

    startTransition(async () => {
      const result = await updateMaterial(selectedCourse.id, editingMaterial.id, materialData)
      if (result.success) {
        await refreshCourses()
        setEditingMaterial(null)
        setShowMaterialModal(false)
      }
    })
  }

  const handleDeleteMaterial = async (materialId: string) => {
    if (!selectedCourse) return

    startTransition(async () => {
      const result = await deleteMaterial(selectedCourse.id, materialId)
      if (result.success) {
        await refreshCourses()
      }
    })
  }

  const handleToggleMaterialVisibility = async (materialId: string) => {
    if (!selectedCourse) return

    startTransition(async () => {
      const result = await toggleMaterialVisibility(selectedCourse.id, materialId)
      if (result.success) {
        await refreshCourses()
      }
    })
  }

  // Syllabus handlers
  const handleAddSyllabus = async (syllabusData: Omit<SyllabusItem, "id">) => {
    if (!selectedCourse) return

    startTransition(async () => {
      const result = await createSyllabusItem(selectedCourse.id, syllabusData)
      if (result.success) {
        await refreshCourses()
        setShowSyllabusModal(false)
      }
    })
  }

  const handleEditSyllabus = async (syllabusData: Omit<SyllabusItem, "id">) => {
    if (!selectedCourse || !editingSyllabus) return

    startTransition(async () => {
      const result = await updateSyllabusItem(selectedCourse.id, editingSyllabus.id, syllabusData)
      if (result.success) {
        await refreshCourses()
        setEditingSyllabus(null)
        setShowSyllabusModal(false)
      }
    })
  }

  const handleDeleteSyllabus = async (syllabusId: string) => {
    if (!selectedCourse) return

    startTransition(async () => {
      const result = await deleteSyllabusItem(selectedCourse.id, syllabusId)
      if (result.success) {
        await refreshCourses()
      }
    })
  }

  // Upload handlers
  const handleAddUpload = async (uploadData: Omit<Upload, "id" | "uploadDate">) => {
    if (!selectedCourse) return

    startTransition(async () => {
      const result = await createUpload(selectedCourse.id, uploadData)
      if (result.success) {
        await refreshCourses()
        setShowUploadModal(false)
      }
    })
  }

  const handleDeleteUpload = async (uploadId: string) => {
    if (!selectedCourse) return

    startTransition(async () => {
      const result = await deleteUpload(selectedCourse.id, uploadId)
      if (result.success) {
        await refreshCourses()
      }
    })
  }

  const filteredMaterials =
    selectedCourse?.materials.filter((material) => {
      const matchesFilter = materialFilter === "all" || material.category === materialFilter
      const matchesSearch =
        material.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
        material.description.toLowerCase().includes(materialSearch.toLowerCase())
      return matchesFilter && matchesSearch
    }) || []

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600">Manage your courses, assignments, and student interactions</p>
          </div>
          <button
            onClick={() => setShowCourseModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Course</span>
          </button>
        </div>

        {!selectedCourse ? (
          /* Course Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => setSelectedCourse(course)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                      <p className="text-sm text-gray-600">
                        {course.code} • {course.semester}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}
                    >
                      {course.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {course.schedule}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                      </svg>
                      {course.room}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                      {course.enrolledStudents} students
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{course.assignments.length} assignments</span>
                      <span>{course.materials.length} materials</span>
                    </div>
                    <div className="text-sm font-medium text-blue-600">{course.credits} credits</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Course Detail View */
          <div className="space-y-6">
            {/* Course Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <button onClick={() => setSelectedCourse(null)} className="p-2 hover:bg-gray-100 rounded-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedCourse.name}</h1>
                    <p className="text-gray-600">
                      {selectedCourse.code} • {selectedCourse.semester}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedCourse.status)}`}
                  >
                    {selectedCourse.status}
                  </span>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Edit Course
                  </button>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedCourse.enrolledStudents}</div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedCourse.assignments.length}</div>
                  <div className="text-sm text-gray-600">Assignments</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{selectedCourse.announcements.length}</div>
                  <div className="text-sm text-gray-600">Announcements</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedCourse.materials.length}</div>
                  <div className="text-sm text-gray-600">Materials</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{selectedCourse.uploads.length}</div>
                  <div className="text-sm text-gray-600">Uploads</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6 overflow-x-auto">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "syllabus", label: "Syllabus" },
                    { id: "students", label: "Students" },
                    { id: "assignments", label: "Assignments" },
                    { id: "announcements", label: "Announcements" },
                    { id: "materials", label: "Materials" },
                    { id: "uploads", label: "Uploads" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Description</h3>
                      <p className="text-gray-600">{selectedCourse.description}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">Schedule:</span>
                          <p className="font-medium">{selectedCourse.schedule}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Room:</span>
                          <p className="font-medium">{selectedCourse.room}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Credits:</span>
                          <p className="font-medium">{selectedCourse.credits}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Syllabus Overview</h3>
                      <div className="space-y-2">
                        {selectedCourse.syllabus.map((topic, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">Week {index + 1}:</span>
                            <span className="text-sm text-gray-900">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "assignments" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Assignments</h3>
                      <button
                        onClick={() => {
                          setEditingAssignment(null)
                          setShowAssignmentModal(true)
                        }}
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Create Assignment</span>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {selectedCourse.assignments.map((assignment) => (
                        <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>Due: {assignment.dueDate}</span>
                                <span>{assignment.totalPoints} points</span>
                                <span>{assignment.submissions} submissions</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  assignment.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : assignment.status === "closed"
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {assignment.status}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingAssignment(assignment)
                                  setShowAssignmentModal(true)
                                }}
                                disabled={isPending}
                                className="text-blue-600 hover:text-blue-800 disabled:text-blue-400"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                disabled={isPending}
                                className="text-red-600 hover:text-red-800 disabled:text-red-400"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "announcements" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
                      <button
                        onClick={() => {
                          setEditingAnnouncement(null)
                          setShowAnnouncementModal(true)
                        }}
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>New Announcement</span>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {selectedCourse.announcements.map((announcement) => (
                        <div key={announcement.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                              <p className="text-xs text-gray-500 mt-2">{announcement.date}</p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(announcement.priority)}`}
                              >
                                {announcement.priority}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingAnnouncement(announcement)
                                  setShowAnnouncementModal(true)
                                }}
                                disabled={isPending}
                                className="text-blue-600 hover:text-blue-800 disabled:text-blue-400"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                                disabled={isPending}
                                className="text-red-600 hover:text-red-800 disabled:text-red-400"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "materials" && (
                  <div className="space-y-6">
                    {/* Materials Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Course Materials</h3>
                      <button
                        onClick={() => {
                          setEditingMaterial(null)
                          setShowMaterialModal(true)
                        }}
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Material</span>
                      </button>
                    </div>

                    {/* Filters and Search */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <svg
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                            type="text"
                            placeholder="Search materials..."
                            value={materialSearch}
                            onChange={(e) => setMaterialSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="sm:w-48">
                        <select
                          value={materialFilter}
                          onChange={(e) => setMaterialFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Categories</option>
                          {materialCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Materials Grid */}
                    {filteredMaterials.length === 0 ? (
                      <div className="text-center py-12">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No materials found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {materialSearch || materialFilter !== "all"
                            ? "Try adjusting your search or filter criteria."
                            : "Get started by adding your first course material."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMaterials.map((material) => (
                          <div
                            key={material.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="text-blue-600">{getMaterialIcon(material.type)}</div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">{material.title}</h4>
                                  <p className="text-xs text-gray-500">{material.category}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleToggleMaterialVisibility(material.id)}
                                  disabled={isPending}
                                  className={`p-1 rounded ${material.isVisible ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"} disabled:opacity-50`}
                                  title={material.isVisible ? "Visible to students" : "Hidden from students"}
                                >
                                  {material.isVisible ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                      />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{material.description}</p>

                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                              <span>{material.uploadDate}</span>
                              {material.fileSize && <span>{material.fileSize}</span>}
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                              <span>{material.downloadCount} downloads</span>
                              <span
                                className={`px-2 py-1 rounded-full ${material.isVisible ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                              >
                                {material.isVisible ? "Visible" : "Hidden"}
                              </span>
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingMaterial(material)
                                  setShowMaterialModal(true)
                                }}
                                disabled={isPending}
                                className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-2 rounded text-xs font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(material.id)}
                                disabled={isPending}
                                className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-2 rounded text-xs font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "syllabus" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Course Syllabus</h3>
                      <button
                        onClick={() => {
                          setEditingSyllabus(null)
                          setShowSyllabusModal(true)
                        }}
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Week</span>
                      </button>
                    </div>

                    {selectedCourse.syllabusItems.length === 0 ? (
                      <div className="text-center py-12">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No syllabus items</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Get started by adding your first week to the syllabus.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedCourse.syllabusItems
                          .sort((a, b) => a.week - b.week)
                          .map((item) => (
                            <div key={item.id} className="bg-gray-50 rounded-lg p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    Week {item.week}: {item.title}
                                  </h4>
                                  <p className="text-gray-600 mt-1">{item.description}</p>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingSyllabus(item)
                                      setShowSyllabusModal(true)
                                    }}
                                    disabled={isPending}
                                    className="text-blue-600 hover:text-blue-800 disabled:text-blue-400"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSyllabus(item.id)}
                                    disabled={isPending}
                                    className="text-red-600 hover:text-red-800 disabled:text-red-400"
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
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-2">Topics</h5>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {item.topics.map((topic, index) => (
                                      <li key={index} className="flex items-start">
                                        <span className="text-gray-400 mr-2">•</span>
                                        {topic}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <h5 className="font-medium text-gray-900 mb-2">Readings</h5>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {item.readings.map((reading, index) => (
                                      <li key={index} className="flex items-start">
                                        <span className="text-gray-400 mr-2">•</span>
                                        {reading}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <h5 className="font-medium text-gray-900 mb-2">Assignments</h5>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {item.assignments.map((assignment, index) => (
                                      <li key={index} className="flex items-start">
                                        <span className="text-gray-400 mr-2">•</span>
                                        {assignment}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {item.notes && (
                                <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                                  <h5 className="font-medium text-gray-900 mb-1">Notes</h5>
                                  <p className="text-sm text-gray-700">{item.notes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "uploads" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">File Uploads</h3>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span>Upload File</span>
                      </button>
                    </div>

                    {selectedCourse.uploads.length === 0 ? (
                      <div className="text-center py-12">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
                        <p className="mt-1 text-sm text-gray-500">Upload your first file to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedCourse.uploads.map((upload) => (
                          <div
                            key={upload.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">{getFileIcon(upload.fileType)}</div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">{upload.name}</h4>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>{upload.fileName}</span>
                                    <span>{upload.fileSize}</span>
                                    <span>Uploaded: {upload.uploadDate}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
                                <button
                                  onClick={() => handleDeleteUpload(upload.id)}
                                  disabled={isPending}
                                  className="text-red-600 hover:text-red-800 disabled:text-red-400"
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
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "students" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Students</h3>
                    <p className="text-gray-600">Student management functionality would be implemented here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <AssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false)
            setEditingAssignment(null)
          }}
          onSubmit={editingAssignment ? handleEditAssignment : handleAddAssignment}
          assignment={editingAssignment}
          isPending={isPending}
        />
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <AnnouncementModal
          isOpen={showAnnouncementModal}
          onClose={() => {
            setShowAnnouncementModal(false)
            setEditingAnnouncement(null)
          }}
          onSubmit={editingAnnouncement ? handleEditAnnouncement : handleAddAnnouncement}
          announcement={editingAnnouncement}
          isPending={isPending}
        />
      )}

      {/* Material Modal */}
      {showMaterialModal && (
        <MaterialModal
          isOpen={showMaterialModal}
          onClose={() => {
            setShowMaterialModal(false)
            setEditingMaterial(null)
          }}
          onSubmit={editingMaterial ? handleEditMaterial : handleAddMaterial}
          material={editingMaterial}
          categories={materialCategories}
          selectedCourse={selectedCourse}
          isPending={isPending}
        />
      )}

      {/* Syllabus Modal */}
      {showSyllabusModal && (
        <SyllabusModal
          isOpen={showSyllabusModal}
          onClose={() => {
            setShowSyllabusModal(false)
            setEditingSyllabus(null)
          }}
          onSubmit={editingSyllabus ? handleEditSyllabus : handleAddSyllabus}
          syllabusItem={editingSyllabus}
          isPending={isPending}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSubmit={handleAddUpload} 
          isPending={isPending}
        />
      )}
    </div>
  )
}

// Assignment Modal Component
function AssignmentModal({
  isOpen,
  onClose,
  onSubmit,
  assignment,
  isPending,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (assignment: Omit<Assignment, "id" | "submissions">) => Promise<void>
  assignment: Assignment | null
  isPending: boolean
}) {
  const [formData, setFormData] = useState({
    title: assignment?.title || "",
    description: assignment?.description || "",
    dueDate: assignment?.dueDate || "",
    totalPoints: assignment?.totalPoints || 100,
    status: assignment?.status || ("active" as "active" | "closed" | "draft"),
    files:[]
  })
  const [uploadMode, setUploadMode] = useState<"existing" | "new">("existing")
  const [selectedFile, setSelectedFile] = useState<File[] >([])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    var files:string[]  = []
    if(selectedFile.length>0){
      for(const file of selectedFile){
        const formData = await UploadService.uploadFile(file)
        if(formData.success && formData.metadata){
          files.push(formData.metadata.fileUrl)
        }
      }
    }
    await onSubmit({...formData,files:files})
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white overflow-y-auto max-h-[calc(100vh-300px)] min-h-full  rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {assignment ? "Edit Assignment" : "Create Assignment"}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
              {/* Show available uploads */}
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setSelectedFile((prev) => [...(prev ?? []), file])
                            
                          }
                        }}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF, DOC up to 10MB</p>
                </div>
              </div>
            </div>
            {selectedFile && selectedFile.length > 0  && selectedFile.map((file: any) => (
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{`${(file.size / 1024 / 1024).toFixed(2)} MB`}</p>
                  </div>
                </div>
              </div>
            ))}             

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Points</label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalPoints}
                  onChange={(e) => setFormData({ ...formData, totalPoints: Number.parseInt(e.target.value) || 100 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md"
              >
                {isPending ? "Saving..." : assignment ? "Update" : "Create"} Assignment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Announcement Modal Component
function AnnouncementModal({
  isOpen,
  onClose,
  onSubmit,
  announcement,
  isPending,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (announcement: Omit<Announcement, "id" | "date">) => Promise<void>
  announcement: Announcement | null
  isPending: boolean
}) {
  const [formData, setFormData] = useState({
    title: announcement?.title || "",
    content: announcement?.content || "",
    priority: announcement?.priority || ("medium" as "low" | "medium" | "high"),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
   await onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {announcement ? "Edit Announcement" : "Create Announcement"}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md"
              >
                {isPending ? "Saving..." : announcement ? "Update" : "Create"} Announcement
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Material Modal Component
function MaterialModal({
  isOpen,
  onClose,
  onSubmit,
  material,
  categories,
  selectedCourse,
  isPending,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (material: Omit<Material, "id" | "uploadDate" | "downloadCount">) => Promise<void>
  material: Material | null
  categories: string[]
  selectedCourse: Course | null
  isPending: boolean
}) {
  const [formData, setFormData] = useState({
    title: material?.title || "",
    description: material?.description || "",
    type: material?.type || ("document" as "file" | "link" | "video" | "document"),
    category: material?.category || categories[0],
    url: material?.url || "",
    fileName: material?.fileName || "",
    fileSize: material?.fileSize || "",
    isVisible: material?.isVisible ?? true,
  })

  const [uploadMode, setUploadMode] = useState<"existing" | "new">("existing")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleSubmit =async (e: React.FormEvent) => {
    e.preventDefault()
    if(uploadMode === "new" && selectedFile) {
      const file  = await UploadService.uploadFile(selectedFile)
      if(file.success && file.metadata){
       await onSubmit({...formData, url: file.metadata.fileUrl, fileName: selectedFile.name, fileSize: `${(file.metadata.size / 1024 / 1024).toFixed(2)} MB`,})
      }
      else{
        toast.error("Failed to upload file. Please try again.")
      }
    }
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{material ? "Edit Material" : "Add New Material"}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="document">Document</option>
                  <option value="video">Video</option>
                  <option value="link">Link</option>
                  <option value="file">File</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* File Source Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">File Source</label>
              <div className="flex space-x-4 mb-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="existing"
                    checked={uploadMode === "existing"}
                    onChange={(e) => setUploadMode(e.target.value as "existing" | "new")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Use existing upload</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="new"
                    checked={uploadMode === "new"}
                    onChange={(e) => setUploadMode(e.target.value as "existing" | "new")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Upload new file</span>
                </label>
              </div>

              {uploadMode === "existing" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.type === "link" ? "URL" : "Select from uploads or enter path"}
                  </label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder={formData.type === "link" ? "https://example.com" : "/materials/filename.pdf"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />

                  {/* Show available uploads */}
                  {selectedCourse && selectedCourse.uploads.length > 0 && formData.type !== "link" && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Or select from uploaded files:
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md">
                        {selectedCourse.uploads.map((upload) => (
                          <button
                            key={upload.id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                url: upload.fileUrl,
                                fileName: upload.fileName,
                                fileSize: upload.fileSize,
                              })
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center space-x-2">
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
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{upload.name}</p>
                                <p className="text-xs text-gray-500">
                                  {upload.fileName} • {upload.fileSize}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload New File</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-8 w-8 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setSelectedFile(file)
                                setFormData({
                                  ...formData,
                                  url: `/materials/${file.name}`,
                                  fileName: file.name,
                                  fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                                })
                              }
                            }}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF, DOC up to 10MB</p>
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="mt-3 bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{formData.fileSize}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {formData.type !== "link" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                  <input
                    type="text"
                    value={formData.fileName}
                    onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                    placeholder="document.pdf"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Size</label>
                  <input
                    type="text"
                    value={formData.fileSize}
                    onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                    placeholder="2.4 MB"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isVisible"
                checked={formData.isVisible}
                onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isVisible" className="ml-2 block text-sm text-gray-700">
                Visible to students
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md"
              >
                {isPending ? "Saving..." : material ? "Update" : "Add"} Material
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Syllabus Modal Component
function SyllabusModal({
  isOpen,
  onClose,
  onSubmit,
  syllabusItem,
  isPending,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (syllabusItem: Omit<SyllabusItem, "id">) => Promise<void>
  syllabusItem: SyllabusItem | null
  isPending: boolean
}) {
  const [formData, setFormData] = useState({
    week: syllabusItem?.week || 1,
    title: syllabusItem?.title || "",
    description: syllabusItem?.description || "",
    topics: syllabusItem?.topics || [""],
    readings: syllabusItem?.readings || [""],
    assignments: syllabusItem?.assignments || [""],
    notes: syllabusItem?.notes || "",
  })

  const handleSubmit =async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanedData = {
      ...formData,
      topics: formData.topics.filter((topic) => topic.trim() !== ""),
      readings: formData.readings.filter((reading) => reading.trim() !== ""),
      assignments: formData.assignments.filter((assignment) => assignment.trim() !== ""),
    }
    await onSubmit(cleanedData)
  }

  const addArrayItem = (field: "topics" | "readings" | "assignments") => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ""],
    })
  }

  const updateArrayItem = (field: "topics" | "readings" | "assignments", index: number, value: string) => {
    const newArray = [...formData[field]]
    newArray[index] = value
    setFormData({
      ...formData,
      [field]: newArray,
    })
  }

  const removeArrayItem = (field: "topics" | "readings" | "assignments", index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index)
    setFormData({
      ...formData,
      [field]: newArray,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {syllabusItem ? "Edit Syllabus Week" : "Add Syllabus Week"}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Week Number</label>
                <input
                  type="number"
                  min="1"
                  value={formData.week}
                  onChange={(e) => setFormData({ ...formData, week: Number.parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Topics */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Topics</label>
                <button
                  type="button"
                  onClick={() => addArrayItem("topics")}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Topic
                </button>
              </div>
              <div className="space-y-2">
                {formData.topics.map((topic, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => updateArrayItem("topics", index, e.target.value)}
                      placeholder="Enter topic"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formData.topics.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("topics", index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Readings */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Readings</label>
                <button
                  type="button"
                  onClick={() => addArrayItem("readings")}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Reading
                </button>
              </div>
              <div className="space-y-2">
                {formData.readings.map((reading, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={reading}
                      onChange={(e) => updateArrayItem("readings", index, e.target.value)}
                      placeholder="Enter reading assignment"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formData.readings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("readings", index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Assignments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Assignments</label>
                <button
                  type="button"
                  onClick={() => addArrayItem("assignments")}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Assignment
                </button>
              </div>
              <div className="space-y-2">
                {formData.assignments.map((assignment, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={assignment}
                      onChange={(e) => updateArrayItem("assignments", index, e.target.value)}
                      placeholder="Enter assignment"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formData.assignments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("assignments", index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes for this week (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md"
              >
                {isPending ? "Saving..." : syllabusItem ? "Update" : "Add"} Week
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Upload Modal Component
function UploadModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (upload: Omit<Upload, "id" | "uploadDate">) => Promise<void>
  isPending: boolean
}) {
  const [formData, setFormData] = useState({
    name: "",
    fileName: "",
    fileSize: "",
    fileType: "document",
    fileUrl:''
  })
  const [selectedFile,setSelectedFile] = useState<File|null>(null)

  const handleSubmit =async (e: React.FormEvent) => {
    e.preventDefault()
    if(selectedFile){
      const file = await UploadService.uploadFile(selectedFile)
      if(file.success && file.metadata){  

   await onSubmit({...formData,fileUrl:file.metadata.fileUrl,fileName:selectedFile.name,fileSize:`${(file.metadata.size / 1024 / 1024).toFixed(2)} MB`})
    setFormData({
      name: "",
      fileName: "",
      fileSize: "",
      fileType: "document",
      fileUrl:''
    })
    }
    else{
      console.error("File upload failed")
      toast.error("Failed to upload file. Please try again.")
    }
    }
    toast.error('Select a file')

  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter a descriptive name for this file"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setSelectedFile(file)
                            setFormData({
                              ...formData,
                              fileName: file.name,
                              fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                              fileType: file.type.includes("pdf") ? "pdf" : "document",
                            })
                          }
                        }}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF, DOC up to 10MB</p>
                </div>
              </div>
            </div>

            {formData.fileName && (
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formData.fileName}</p>
                    <p className="text-xs text-gray-500">{formData.fileSize}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name || !formData.fileName || isPending}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md"
              >
                {isPending ? "Uploading..." : "Upload File"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
