


"use client"

import { useState, useEffect } from "react"
import { getExams, getExamById, createExam, updateExam, type Exam } from "@/app/actions/teacher/exam.action"
import { Loader2, X, Upload, FileText, Calendar, Clock, MapPin, Users, BookOpen, FileCheck } from "lucide-react"
import { toast } from "sonner"

// Types
type Question = {
  id: string
  type: "multiple-choice" | "short-answer" | "essay" | "true-false"
  question: string
  options?: string[]
  correctAnswer?: string | number
  points: number
  difficulty: "easy" | "medium" | "hard"
}

type ExamFormData = {
  id?: string
  title: string
  course: string
  courseCode: string
  date: string
  time: string
  duration: number
  room: string
  totalMarks: number
  passingMarks: number
  instructions: string[]
  status: "draft" | "scheduled" | "active" | "completed" | "graded"
  semesterCourseId: string
  examFile?: File
}

export default function TeacherExams() {
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [activeTab, setActiveTab] = useState<"details" | "questions" | "results" | "analytics">("details")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [modalLoading, setModalLoading] = useState(false)
   const [showUpdateModal, setShowUpdateModal] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<ExamFormData>({
    title: "",
    course: "",
    courseCode: "",
    date: "",
    time: "",
    duration: 120,
    room: "",
    totalMarks: 100,
    passingMarks: 60,
    instructions: ["Read all questions carefully before answering", "Manage your time effectively"],
    status: "draft",
    semesterCourseId: ""
  })
  
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
 

  // Fetch exams on component mount
  useEffect(() => {
    async function fetchExams() {
      setLoading(true)
      try {
        const result = await getExams()
        if (result.success) {
          setExams(result.data as any)
        } else {
          toast.error('Failed to fetch exams')
        }
      } catch (error) {
        console.error("Error fetching exams:", error)
        toast.error('Failed to fetch exams')
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [toast])

  // Fetch exam details when an exam is selected
  useEffect(() => {
    if (selectedExam?.id) {
      async function fetchExamDetails() {
        try {
          const result = await getExamById(selectedExam?.id!)
          if (result.success) {
            setSelectedExam(result.data!)
          } else {
            toast.error(result.error || "Failed to fetch exam details")
          }
        } catch (error) {
          console.error("Error fetching exam details:", error)
        }
      }

      fetchExamDetails()
    }
  }, [selectedExam?.id, toast])

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || exam.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-purple-100 text-purple-800"
      case "graded":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf' || file.type.startsWith('image/') || file.type.includes('document')) {
        setUploadedFile(file)
        setFormData(prev => ({ ...prev, examFile: file }))
        toast.success('File uploaded successfully')
      } else {
        toast.error('Please upload a PDF, image, or document file')
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileUpload(e.dataTransfer.files)
  }

  // Handle form submission
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalLoading(true)
    
    try {
      const result = await createExam(formData)
      if (result.success) {
        toast.success('Exam created successfully')
        setShowCreateModal(false)
        resetForm()
        // Refresh exams list
        const updatedExams = await getExams()
        if (updatedExams.success) {
          setExams(updatedExams.data as any)
        }
      } else {
        toast.error( 'Failed to create exam')
      }
    } catch (error) {
      console.error('Error creating exam:', error)
      toast.error('Failed to create exam')
    } finally {
      setModalLoading(false)
    }
  }

  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalLoading(true)
    
    try {
      const result = await updateExam(formData)
      if (result.success) {
        toast.success('Exam updated successfully')
        setShowUpdateModal(false)
        resetForm()
        // Refresh exams list
        const updatedExams = await getExams()
        if (updatedExams.success) {
          setExams(updatedExams.data as any)
        }
        // Update selected exam if it's currently selected
        if (selectedExam?.id === formData.id) {
          const updatedExam = await getExamById(formData.id!)
          if (updatedExam.success) {
            setSelectedExam(updatedExam.data!)
          }
        }
      } else {
        toast.error('Failed to update exam')
      }
    } catch (error) {
      console.error('Error updating exam:', error)
      toast.error('Failed to update exam')
    } finally {
      setModalLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      course: "",
      courseCode: "",
      date: "",
      time: "",
      duration: 120,
      room: "",
      totalMarks: 100,
      passingMarks: 60,
      instructions: ["Read all questions carefully before answering", "Manage your time effectively"],
      status: "draft",
      semesterCourseId: ""
    })
    setUploadedFile(null)
  }

  const openUpdateModal = (exam: Exam) => {
    setFormData({
      id: exam.id,
      title: exam.title,
      course: exam.course,
      courseCode: exam.courseCode,
      date: exam.date,
      time: exam.time,
      duration: exam.duration,
      room: exam.room,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      instructions: exam.instructions,
      status: exam.status,
      semesterCourseId: "" // This would come from the backend
    })
    setShowUpdateModal(true)
  }

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, ""]
    }))
  }

  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }))
  }

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }))
  }
 const ExamModal = ({ 
    isOpen, 
    onClose, 
    title, 
    onSubmit 
  }: { 
    isOpen: boolean
    onClose: () => void
    title: string
    onSubmit: (e: React.FormEvent) => void
  }) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={onSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course *
                </label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code *
                </label>
                <input
                  type="text"
                  value={formData.courseCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, courseCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester Course ID *
                </label>
                <input
                  type="text"
                  value={formData.semesterCourseId}
                  onChange={(e) => setFormData(prev => ({ ...prev, semesterCourseId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room *
                </label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Marks *
                </label>
                <input
                  type="number"
                  value={formData.totalMarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalMarks: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Marks *
                </label>
                <input
                  type="number"
                  value={formData.passingMarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, passingMarks: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="graded">Graded</option>
                </select>
              </div>
            </div>
            
            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <div className="space-y-2">
                {formData.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter instruction"
                    />
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
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
            
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam File (Optional)
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploadedFile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-6 h-6 text-green-600" />
                    <span className="text-sm text-gray-700">{uploadedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null)
                        setFormData(prev => ({ ...prev, examFile: undefined }))
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop your exam file here, or click to browse
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                    >
                      Choose File
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      PDF, DOC, DOCX, JPG, JPEG, PNG files only
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={modalLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{title.includes('Create') ? 'Create' : 'Update'} Exam</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Loading exams...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
            <p className="text-gray-600">Create, manage, and grade your exams</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Exam</span>
          </button>
        </div>
        {!selectedExam ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Exams</p>
                    <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
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
                    <p className="text-sm font-medium text-gray-600">Scheduled</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {exams.filter((e) => e.status === "scheduled").length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {exams.filter((e) => e.status === "completed" || e.status === "graded").length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <p className="text-sm font-medium text-gray-600">Avg Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(
                        exams.filter((e) => e.averageScore).reduce((acc, e) => acc + (e.averageScore || 0), 0) /
                          exams.filter((e) => e.averageScore).length || 0,
                      )}
                      %
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
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
                    placeholder="Search exams..."
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
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="graded">Graded</option>
                </select>
              </div>
            </div>
            {/* Exams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.length > 0 ? (
                filteredExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                    onClick={() => setSelectedExam(exam)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                          <p className="text-sm text-gray-600">
                            {exam.courseCode} • {exam.course}
                          </p>
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(exam.status)}`}
                        >
                          {exam.status}
                        </span>
                      </div>
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
                          {exam.date} at {exam.time}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {exam.duration} minutes
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
                          {exam.room}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{exam.totalMarks}</span> total marks
                        </div>
                        <div className="text-sm text-gray-600">
                          {exam.studentsCompleted}/{exam.studentsEnrolled} completed
                        </div>
                      </div>
                      {exam.averageScore !== undefined && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Average Score</span>
                            <span className="font-medium text-gray-900">{exam.averageScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(exam.averageScore / exam.totalMarks) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 flex items-center justify-center p-8 bg-white rounded-lg border border-gray-200">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">No exams found matching your criteria</p>
                    <button
                      onClick={() => {
                        setSearchTerm("")
                        setFilterStatus("all")
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Exam Detail View */
          <div className="space-y-6">
            {/* Exam Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <button onClick={() => setSelectedExam(null)} className="p-2 hover:bg-gray-100 rounded-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedExam.title}</h1>
                    <p className="text-gray-600">
                      {selectedExam.courseCode} • {selectedExam.course}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedExam.status)}`}
                  >
                    {selectedExam.status}
                  </span>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Edit Exam
                  </button>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedExam.totalMarks}</div>
                  <div className="text-sm text-gray-600">Total Marks</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedExam.duration}</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{selectedExam.questions.length}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedExam.studentsEnrolled}</div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{selectedExam.averageScore || 0}%</div>
                  <div className="text-sm text-gray-600">Avg Score</div>
                </div>
              </div>
            </div>
            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: "details", label: "Details" },
                    { id: "questions", label: "Questions" },
                    { id: "results", label: "Results" },
                    { id: "analytics", label: "Analytics" },
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
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Date & Time:</span>
                            <span className="text-sm font-medium">
                              {selectedExam.date} at {selectedExam.time}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Duration:</span>
                            <span className="text-sm font-medium">{selectedExam.duration} minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Room:</span>
                            <span className="text-sm font-medium">{selectedExam.room}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Marks:</span>
                            <span className="text-sm font-medium">{selectedExam.totalMarks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Passing Marks:</span>
                            <span className="text-sm font-medium">{selectedExam.passingMarks}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
                        <ul className="space-y-2">
                          {selectedExam.instructions.map((instruction, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-blue-600 mt-1">•</span>
                              <span className="text-sm text-gray-600">{instruction}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === "questions" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Questions ({selectedExam.questions.length})
                      </h3>
                      <button
                        onClick={() => setShowQuestionModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Question</span>
                      </button>
                    </div>
                    <div className="space-y-4">
                      {selectedExam.questions.map((question, index) => (
                        <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">Q{index + 1}.</span>
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty)}`}
                              >
                                {question.difficulty}
                              </span>
                              <span className="text-xs text-gray-500">{question.points} points</span>
                            </div>
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {question.type.replace("-", " ")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 mb-3">{question.question}</p>
                          {question.options && (
                            <div className="space-y-1">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`text-sm p-2 rounded ${
                                    question.correctAnswer === optIndex ? "bg-green-50 text-green-800" : "text-gray-600"
                                  }`}
                                >
                                  {option}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === "results" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Results</h3>
                    {selectedExam.status === "completed" || selectedExam.status === "graded" ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">{selectedExam.studentsCompleted}</div>
                            <div className="text-sm text-gray-600">Students Completed</div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">{selectedExam.averageScore}%</div>
                            <div className="text-sm text-gray-600">Average Score</div>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {Math.round(((selectedExam.averageScore || 0) / selectedExam.totalMarks) * 100)}%
                            </div>
                            <div className="text-sm text-gray-600">Pass Rate</div>
                          </div>
                        </div>
                        <p className="text-gray-600">
                          Detailed results and individual student scores would be displayed here.
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-600">Results will be available after the exam is completed.</p>
                    )}
                  </div>
                )}
                {activeTab === "analytics" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Analytics</h3>
                    <p className="text-gray-600">
                      Detailed analytics including question-wise performance, time analysis, and difficulty assessment
                      would be displayed here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {
        selectedExam && showUpdateModal && (
          <ExamModal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="Update Exam" onSubmit={handleUpdateExam} />
        )
      }
      {
        showCreateModal && (
          <ExamModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Exam" onSubmit={handleCreateExam} />
        )
      }
      
      
    </div>
  )
}
