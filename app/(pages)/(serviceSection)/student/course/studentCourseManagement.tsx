"use client"

import { useState, useEffect, useTransition } from "react"
import type React from "react"
import {
  getAvailableCourses,
  getEnrolledCourses,
  enrollInCourse,
  unenrollFromCourse,
  getCourseAssignments,
  getCourseExams,
  getCourseMaterials,
  downloadMaterial,
  getCourseAnnouncements,
  submitAssignment as actionSubmitAssignment,
  submitExam as actionSubmitExam,
  type CourseAssignmentWithSubmissions,
  type ExamWithSubmissions,
} from "@/app/actions/student/course.action"
import { toast } from "sonner"
import {
  BookOpen,
  Calendar,
  FileText,
  Download,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Star,
  Search,
  Filter,
  Eye,
  Send,
  X,
  Plus,
  User,
  Building,
  MapPin,
} from "lucide-react"

// Updated types to match the action file
export type CourseExtras = {
  prerequisites: string[]
  objective: string[]
}

export type Course = {
  id: string
  name: string
  code: string
  department: {
    id: string
    name: string
    slug: string
    departmentHeadName?: string
    departmentHeadEmail?: string
  }
  schedule?: string
  room?: string
  instructor?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  courseInfo: string
  credits: number
  courseExtras?: string
  status: string
  enrolledStudents?: number
  maxStudents?: number
  isEnrolled?: boolean
  enrollmentDate?: string
  grade?: string
  progress?: number
  semesterCourseId?: string
}

export type Assignment = {
  id: string
  title: string
  description: string
  dueDate: string
  totalPoints: number
  submissionStatus: "not_submitted" | "submitted" | "graded"
  submittedAt?: string
  grade?: number
  feedback?: string
  attachments?: string[]
  studentSubmissions?: any[]
}

export type Exam = {
  id: string
  title: string
  description: string
  examDate: string
  duration: number
  totalPoints: number
  status: "upcoming" | "in_progress" | "completed" | "missed"
  submissionStatus: "not_submitted" | "submitted" | "graded"
  grade?: number
  questions?: any[]
  studentSubmissions?: any[]
}

export type Material = {
  id: string
  title: string
  description: string
  type: "file" | "link" | "video" | "document"
  category: string
  url?: string
  fileName?: string
  fileSize?: string
  uploadDate: string
  downloadCount: number
  isVisible: boolean
  file?: {
    id: string
    originalName: string
    fileUrl: string
  }
}

export type Announcement = {
  id: string
  title: string
  content: string
  createdAt: string
  priority: "low" | "medium" | "high"
  isRead?: boolean
}

type Props = {
  studentId: string
  initialEnrolledCourses?: Course[]
  initialAvailableCourses?: Course[]
}

// Helper functions
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-800"
    case "upcoming":
      return "bg-yellow-100 text-yellow-800"
    case "inactive":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
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

// Assignment Submission Modal Component
const AssignmentSubmissionModal = ({
  assignment,
  onClose,
  onSubmit,
  isPending,
}: {
  assignment: Assignment
  onClose: () => void
  onSubmit: (assignmentId: string, files: File[]) => void
  isPending: boolean
}) => {
  const [submissionText, setSubmissionText] = useState("")
  const [files, setFiles] = useState<File[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(assignment.id, files)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Submit Assignment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">{assignment.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{assignment.description}</p>
            <div className="text-sm text-gray-500">
              <p>Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
              <p>Points: {assignment.totalPoints}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Submission Text (Optional)
            </label>
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes or comments..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Files
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Submitting..." : "Submit Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Exam Modal Component
const ExamModal = ({
  exam,
  onClose,
  onSubmit,
  isPending,
}: {
  exam: Exam
  onClose: () => void
  onSubmit: (examId: string, answers: { [questionId: string]: string }) => void
  isPending: boolean
}) => {
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({})

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(exam.id, answers)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Take Exam</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">{exam.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{exam.description}</p>
            <div className="text-sm text-gray-500">
              <p>Duration: {exam.duration} minutes</p>
              <p>Total Points: {exam.totalPoints}</p>
            </div>
          </div>

          <div className="space-y-4">
            {exam.questions?.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Question {index + 1} ({question.points} points)
                </h4>
                <p className="text-gray-700 mb-3">{question.question}</p>
                
                {question.type === "multiple_choice" && question.options ? (
                  <div className="space-y-2">
                    {question.options.map((option: string, optIndex: number) => (
                      <label key={optIndex} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          value={option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="form-radio"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[question.id] || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your answer..."
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isPending ? "Submitting..." : "Submit Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function StudentCourseManagement({
  studentId,
  initialEnrolledCourses = [],
  initialAvailableCourses = [],
}: Props) {
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>(initialEnrolledCourses)
  const [availableCourses, setAvailableCourses] = useState<Course[]>(initialAvailableCourses)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [activeTab, setActiveTab] = useState<"enrolled" | "available" | "details">("enrolled")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "upcoming">("all")
  const [isPending, startTransition] = useTransition()

  // Course details data
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  // Modal states
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showExamModal, setShowExamModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)

  // Content tabs for course details
  const [detailsActiveTab, setDetailsActiveTab] = useState<"assignments" | "exams" | "materials" | "announcements">("assignments")

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const [enrolledResult, availableResult] = await Promise.all([
        getEnrolledCourses(studentId),
        getAvailableCourses(studentId),
      ])

      if (enrolledResult.success && enrolledResult.data) {
        setEnrolledCourses(enrolledResult.data as any)
      }

      if (availableResult.success && availableResult.data) {
        setAvailableCourses(availableResult.data as any)
      }
    }
    loadData()
  }, [studentId])

  // Load course details when a course is selected
  useEffect(() => {
    if (selectedCourse && selectedCourse.semesterCourseId && activeTab === "details") {
      const loadCourseDetails = async () => {
        const [assignmentsResult, examsResult, materialsResult, announcementsResult] = await Promise.all([
          getCourseAssignments(selectedCourse.semesterCourseId!, studentId),
          getCourseExams(selectedCourse.semesterCourseId!, studentId),
          getCourseMaterials(selectedCourse.semesterCourseId!),
          getCourseAnnouncements(selectedCourse.semesterCourseId!),
        ])

        if (assignmentsResult.success && assignmentsResult.data) {
          setAssignments(
            assignmentsResult.data.map((a: CourseAssignmentWithSubmissions) => ({
              id: a.id,
              title: a.title,
              description: a.description,
              dueDate: a.dueDate.toISOString(),
              totalPoints: a.totalPoints,
              submissionStatus: a.studentSubmissions && a.studentSubmissions.length > 0 ? 
                (a.studentSubmissions[0].status === "GRADED" ? "graded" : "submitted") : "not_submitted",
              submittedAt: a.studentSubmissions?.[0]?.submittedAt?.toISOString(),
              grade: a.studentSubmissions?.[0]?.grade as any,
              feedback: a.studentSubmissions?.[0]?.feedback as any,
              attachments: a.files,
              studentSubmissions: a.studentSubmissions,
            }))
          )
        }

        if (examsResult.success && examsResult.data) {
          setExams(
            examsResult.data.map((e: ExamWithSubmissions) => ({
              id: e.id,
              title: e.title,
              description: e.description,
              examDate: e.examDate.toISOString(),
              duration: e.duration,
              totalPoints: e.totalPoints,
              status: e.status.toLowerCase() as Exam['status'],
              submissionStatus: e.studentSubmissions && e.studentSubmissions.length > 0 ? 
                (e.studentSubmissions[0].status === "GRADED" ? "graded" : "submitted") : "not_submitted",
              grade: e.studentSubmissions?.[0]?.grade as any,
              questions: e.questions,
              studentSubmissions: e.studentSubmissions,
            }))
          )
        }

        if (materialsResult.success && materialsResult.data) {
          setMaterials(
            materialsResult.data.map((m: any) => ({
              id: m.id,
              title: m.title,
              description: m.description || "",
              type: m.type || "file",
              category: m.category || "General",
              url: m.url || m.file?.fileUrl,
              fileName: m.fileName || m.file?.originalName,
              fileSize: m.fileSize,
              uploadDate: m.createdAt,
              downloadCount: m.downloadCount || 0,
              isVisible: m.isVisible,
              file: m.file,
            }))
          )
        }

        if (announcementsResult.success && announcementsResult.data) {
          setAnnouncements(
            announcementsResult.data.map((a: any) => ({
              id: a.id,
              title: a.title,
              content: a.content,
              createdAt: a.createdAt,
              priority: a.priority || "medium",
              isRead: false,
            }))
          )
        }
      }
      loadCourseDetails()
    }
  }, [selectedCourse, activeTab, studentId])

  // Filter functions
  const filteredEnrolledCourses = enrolledCourses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || course.status.toLowerCase() === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredAvailableCourses = availableCourses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || course.status.toLowerCase() === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleEnrollment = async (semesterCourseId: string, action: "enroll" | "unenroll") => {
    if (!semesterCourseId) {
      toast.error("Invalid course selection")
      return
    }

    startTransition(async () => {
      const result = action === "enroll"
        ? await enrollInCourse(studentId, semesterCourseId)
        : await unenrollFromCourse(studentId, semesterCourseId)

      if (result.success) {
        toast.success(
          action === 'enroll' ? 'Successfully enrolled in course' : 'Successfully unenrolled from course'
        )
        
        // Refresh the course lists
        const [enrolledResult, availableResult] = await Promise.all([
          getEnrolledCourses(studentId),
          getAvailableCourses(studentId),
        ])

        if (enrolledResult.success && enrolledResult.data) {
          setEnrolledCourses(enrolledResult.data as any)
        }

        if (availableResult.success && availableResult.data) {
          setAvailableCourses(availableResult.data as any)
        }
      } else {
        toast.error(result.error || "Operation failed")
      }
    })
  }

  const handleAssignmentSubmission = async (assignmentId: string, files: File[]) => {
    startTransition(async () => {
      // In a real implementation, you would upload files first and get fileIds
      const fileIds: string[] = [] // Replace with actual file upload logic
      const result = await actionSubmitAssignment(assignmentId, studentId, undefined, fileIds)
      
      if (result.success) {
        toast.success("Assignment submitted successfully")
        setShowAssignmentModal(false)
        setSelectedAssignment(null)
        
        // Refresh assignments
        if (selectedCourse && selectedCourse.semesterCourseId) {
          const assignmentsResult = await getCourseAssignments(selectedCourse.semesterCourseId, studentId)
          if (assignmentsResult.success && assignmentsResult.data) {
            setAssignments(
              assignmentsResult.data.map((a: CourseAssignmentWithSubmissions) => ({
                id: a.id,
                title: a.title,
                description: a.description,
                dueDate: a.dueDate.toISOString(),
                totalPoints: a.totalPoints,
                submissionStatus: a.studentSubmissions && a.studentSubmissions.length > 0 ? 
                  (a.studentSubmissions[0].status === "GRADED" ? "graded" : "submitted") : "not_submitted",
                submittedAt: a.studentSubmissions?.[0]?.submittedAt?.toISOString(),
                grade: a.studentSubmissions?.[0]?.grade as any,
                feedback: a.studentSubmissions?.[0]?.feedback as any,
                attachments: a.files,
                studentSubmissions: a.studentSubmissions,
              }))
            )
          }
        }
      } else {
        toast.error(result.error || "Failed to submit assignment")
      }
    })
  }

  const handleExamSubmission = async (examId: string, answers: { [questionId: string]: string }) => {
    startTransition(async () => {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }))
      const result = await actionSubmitExam(examId, studentId, formattedAnswers)
      
      if (result.success) {
        toast.success("Exam submitted successfully")
        setShowExamModal(false)
        setSelectedExam(null)
        
        // Refresh exams
        if (selectedCourse && selectedCourse.semesterCourseId) {
          const examsResult = await getCourseExams(selectedCourse.semesterCourseId, studentId)
          if (examsResult.success && examsResult.data) {
            setExams(
              examsResult.data.map((e: ExamWithSubmissions) => ({
                id: e.id,
                title: e.title,
                description: e.description,
                examDate: e.examDate.toISOString(),
                duration: e.duration,
                totalPoints: e.totalPoints,
                status: e.status.toLowerCase() as Exam['status'],
                submissionStatus: e.studentSubmissions && e.studentSubmissions.length > 0 ? 
                  (e.studentSubmissions[0].status === "GRADED" ? "graded" : "submitted") : "not_submitted",
                grade: e.studentSubmissions?.[0]?.grade as any,
                questions: e.questions,
                studentSubmissions: e.studentSubmissions,
              }))
            )
          }
        }
      } else {
        toast.error(result.error || "Failed to submit exam")
      }
    })
  }

  const handleMaterialDownload = async (materialId: string) => {
    startTransition(async () => {
      const result = await downloadMaterial(materialId)
      
      if (result.success && result.data) {
        // Create a temporary link to download the file
        const link = document.createElement('a')
        link.href = result.data.downloadUrl || ''
        link.download = result.data.fileName || 'download'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success("Material downloaded successfully")
        
        // Refresh materials to update download count
        if (selectedCourse && selectedCourse.semesterCourseId) {
          const materialsResult = await getCourseMaterials(selectedCourse.semesterCourseId)
          if (materialsResult.success && materialsResult.data) {
            setMaterials(
              materialsResult.data.map((m: any) => ({
                id: m.id,
                title: m.title,
                description: m.description || "",
                type: m.type || "file",
                category: m.category || "General",
                url: m.url || m.file?.fileUrl,
                fileName: m.fileName || m.file?.originalName,
                fileSize: m.fileSize,
                uploadDate: m.createdAt,
                downloadCount: m.downloadCount || 0,
                isVisible: m.isVisible,
                file: m.file,
              }))
            )
          }
        }
      } else {
        toast.error(result.error || "Failed to download material")
      }
    })
  }

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course)
    setActiveTab("details")
  }

  const renderCourseCard = (course: Course, showEnrollmentActions: boolean = false) => (
    <div
      key={course.id}
      className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{course.code}</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
              {course.status}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCourseSelect(course)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            {showEnrollmentActions && (
              <button
                onClick={() => handleEnrollment(course.semesterCourseId!, course.isEnrolled ? "unenroll" : "enroll")}
                disabled={isPending || !course.semesterCourseId}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  course.isEnrolled
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                } disabled:opacity-50`}
              >
                {isPending ? "..." : course.isEnrolled ? "Unenroll" : "Enroll"}
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Credits: {course.credits}</span>
          </div>
          
          {course.department && (
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4" />
              <span>{course.department.name}</span>
            </div>
          )}
          
          {course.instructor && (
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{course.instructor.firstName} {course.instructor.lastName}</span>
            </div>
          )}
          
          {course.schedule && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{course.schedule}</span>
            </div>
          )}
          
          {course.room && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>{course.room}</span>
            </div>
          )}
          
          {course.enrolledStudents !== undefined && (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>{course.enrolledStudents} students enrolled</span>
            </div>
          )}
          
          {course.grade && (
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Grade: {course.grade}</span>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-700 line-clamp-2">{course.courseInfo}</p>
        </div>
      </div>
    </div>
  )

  const renderAssignments = () => (
    <div className="space-y-4">
      {assignments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No assignments available</p>
        </div>
      ) : (
        assignments.map((assignment) => (
          <div key={assignment.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{assignment.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>{assignment.totalPoints} points</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  assignment.submissionStatus === "graded" ? "bg-green-100 text-green-800" :
                  assignment.submissionStatus === "submitted" ? "bg-blue-100 text-blue-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {assignment.submissionStatus === "graded" ? "Graded" :
                   assignment.submissionStatus === "submitted" ? "Submitted" :
                   "Not Submitted"}
                </span>
                
                {assignment.submissionStatus === "not_submitted" && (
                  <button
                    onClick={() => {
                      setSelectedAssignment(assignment)
                      setShowAssignmentModal(true)
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
            
            {assignment.submissionStatus === "graded" && assignment.grade !== undefined && (
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">
                    Grade: {assignment.grade}/{assignment.totalPoints}
                  </span>
                  <span className="text-sm font-medium text-green-800">
                    {Math.round((assignment.grade / assignment.totalPoints) * 100)}%
                  </span>
                </div>
                {assignment.feedback && (
                  <p className="mt-2 text-sm text-green-700">{assignment.feedback}</p>
                )}
              </div>
            )}
            
            {assignment.submissionStatus === "submitted" && assignment.submittedAt && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  Submitted on: {new Date(assignment.submittedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )

  const renderExams = () => (
    <div className="space-y-4">
      {exams.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No exams available</p>
        </div>
      ) : (
        exams.map((exam) => (
          <div key={exam.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{exam.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Date: {new Date(exam.examDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Duration: {exam.duration} minutes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>{exam.totalPoints} points</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                  {exam.status}
                </span>
                
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  exam.submissionStatus === "graded" ? "bg-green-100 text-green-800" :
                  exam.submissionStatus === "submitted" ? "bg-blue-100 text-blue-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {exam.submissionStatus === "graded" ? "Graded" :
                   exam.submissionStatus === "submitted" ? "Submitted" :
                   "Not Submitted"}
                </span>
                
                {exam.submissionStatus === "not_submitted" && exam.status === "upcoming" && (
                  <button
                    onClick={() => {
                      setSelectedExam(exam)
                      setShowExamModal(true)
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    Take Exam
                  </button>
                )}
              </div>
            </div>
            
            {exam.submissionStatus === "graded" && exam.grade !== undefined && (
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">
                    Grade: {exam.grade}/{exam.totalPoints}
                  </span>
                  <span className="text-sm font-medium text-green-800">
                    {Math.round((exam.grade / exam.totalPoints) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )

  const renderMaterials = () => (
    <div className="space-y-4">
      {materials.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No materials available</p>
        </div>
      ) : (
        materials.map((material) => (
          <div key={material.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{material.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{material.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{material.type}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Uploaded: {new Date(material.uploadDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Download className="w-4 h-4" />
                    <span>{material.downloadCount} downloads</span>
                  </div>
                  {material.fileSize && (
                    <div className="flex items-center space-x-1">
                      <span>Size: {material.fileSize}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleMaterialDownload(material.id)}
                disabled={isPending}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
              >
                {isPending ? "..." : "Download"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const renderAnnouncements = () => (
    <div className="space-y-4">
      {announcements.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No announcements available</p>
        </div>
      ) : (
        announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                    {announcement.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{announcement.content}</p>
                
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Management</h1>
          <p className="text-gray-600">Manage your enrolled courses and explore available options</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("enrolled")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "enrolled"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Enrolled Courses ({enrolledCourses.length})
            </button>
            <button
              onClick={() => setActiveTab("available")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "available"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Available Courses ({availableCourses.length})
            </button>
            {selectedCourse && (
              <button
                onClick={() => setActiveTab("details")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "details"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Course Details
              </button>
            )}
          </nav>
        </div>

        {/* Search and Filter */}
        {activeTab !== "details" && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "upcoming")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === "enrolled" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnrolledCourses.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">No enrolled courses found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredEnrolledCourses.map((course) => renderCourseCard(course, true))
            )}
          </div>
        )}

        {activeTab === "available" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAvailableCourses.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Plus className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">No available courses found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredAvailableCourses.map((course) => renderCourseCard(course, true))
            )}
          </div>
        )}

        {activeTab === "details" && selectedCourse && (
          <div className="bg-white rounded-lg shadow-md">
            {/* Course Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCourse.name}</h2>
                  <p className="text-gray-600 mb-4">{selectedCourse.code}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>Credits: {selectedCourse.credits}</span>
                    </div>
                    {selectedCourse.instructor && (
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{selectedCourse.instructor.firstName} {selectedCourse.instructor.lastName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("enrolled")}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Course Content Tabs */}
            <div className="px-6 py-4 border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setDetailsActiveTab("assignments")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    detailsActiveTab === "assignments"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Assignments ({assignments.length})
                </button>
                <button
                  onClick={() => setDetailsActiveTab("exams")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    detailsActiveTab === "exams"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Exams ({exams.length})
                </button>
                <button
                  onClick={() => setDetailsActiveTab("materials")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    detailsActiveTab === "materials"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Materials ({materials.length})
                </button>
                <button
                  onClick={() => setDetailsActiveTab("announcements")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    detailsActiveTab === "announcements"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Announcements ({announcements.length})
                </button>
              </nav>
            </div>

            {/* Course Content */}
            <div className="p-6">
              {detailsActiveTab === "assignments" && renderAssignments()}
              {detailsActiveTab === "exams" && renderExams()}
              {detailsActiveTab === "materials" && renderMaterials()}
              {detailsActiveTab === "announcements" && renderAnnouncements()}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAssignmentModal && selectedAssignment && (
        <AssignmentSubmissionModal
          assignment={selectedAssignment}
          onClose={() => {
            setShowAssignmentModal(false)
            setSelectedAssignment(null)
          }}
          onSubmit={handleAssignmentSubmission}
          isPending={isPending}
        />
      )}

      {showExamModal && selectedExam && (
        <ExamModal
          exam={selectedExam}
          onClose={() => {
            setShowExamModal(false)
            setSelectedExam(null)
          }}
          onSubmit={handleExamSubmission}
          isPending={isPending}
        />
      )}
    </div>
  )
}