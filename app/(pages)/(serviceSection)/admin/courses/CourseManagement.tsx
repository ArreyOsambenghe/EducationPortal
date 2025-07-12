"use client"

import { createCourse, deleteCourse, updateCourse } from "@/app/actions/admin/course.action"
import type React from "react"

import { useState } from "react"
import { toast } from "sonner"

// Course types based on your specification
export type CourseExtras = {
  prerequisites: string[]
  objective: string[]
}

export type Course = {
  id?: string
  name: string
  code: string
  department: {
    id: string
    name: string
  }
  schedule?: string
  room?: string
  instructor?: {
    id: string
    name: string
  }
  courseInfo: string
  credits: number
  courseExtras?: CourseExtras
  status: "active" | "inactive" | "upcomming"
  activeId:string|null
}


type Props = {
    Instructors:{id:string,name:string}[]
    Departments:{id:string,name:string}[]
    initialCourses:Course[]
}

// Mock data for courses


export default function CourseCRUD({Instructors,Departments,initialCourses}:Props) {
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | "delete">("create")
  const [formData, setFormData] = useState<Course>({
    name: "",
    code: "",
    department: { id: "", name: "" },
    schedule: "",
    room: "",
    instructor: { id: "", name: "" },
    courseInfo: "",
    credits: 0,
    courseExtras: {
      prerequisites: [],
      objective: [],
    },
    status: "active",
    activeId:''
  })
  const [prerequisiteInput, setPrerequisiteInput] = useState("")
  const [objectiveInput, setObjectiveInput] = useState("")

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     course.instructor && course.instructor.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: Course["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "upcomming":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const openModal = (mode: "create" | "edit" | "view" | "delete", course?: Course) => {
    setModalMode(mode)
    if (course) {
      setSelectedCourse(course)
      setFormData({
        id:course.id ||  '',
        name: course.name,
        code: course.code,
        department: course.department,
        schedule: course.schedule,
        room: course.room,
        instructor: course.instructor,
        courseInfo: course.courseInfo,
        credits: course.credits,
        courseExtras: course.courseExtras,
        status: course.status,
        activeId: course.activeId,
      })
    } else {
      setFormData({
        name: "",
        code: "",
        department: { id: "", name: "" },
        schedule: "",
        room: "",
        instructor: { id: "", name: "" },
        courseInfo: "",
        credits: 0,
        courseExtras: {
          prerequisites: [],
          objective: [],
        },
        status: "active",
        activeId: '',
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedCourse(null)
    setPrerequisiteInput("")
    setObjectiveInput("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === "credits") {
      setFormData((prev) => ({ ...prev, [name]: Number.parseInt(value) || 0 }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDept = Departments.find((dept) => dept.id === e.target.value)
    if (selectedDept) {
      setFormData((prev) => ({ ...prev, department: selectedDept }))
    }
  }

  const handleInstructorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedInst = Instructors.find((inst) => inst.id === e.target.value)
    if (selectedInst) {
      setFormData((prev) => ({ ...prev, instructor: selectedInst }))
    }
  }

  const addPrerequisite = () => {
    if (prerequisiteInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        courseExtras: {
          prerequisites: [
            ...(prev.courseExtras?.prerequisites ?? []),
            prerequisiteInput.trim(),
          ],
          objective: prev.courseExtras?.objective ?? [],
        },
      }))
      setPrerequisiteInput("")
    }
  }

  const removePrerequisite = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      courseExtras: {
        prerequisites: (prev.courseExtras?.prerequisites ?? []).filter((_, i) => i !== index),
        objective: prev.courseExtras?.objective ?? [],
      },
    }))
  }

  const addObjective = () => {
    if (objectiveInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        courseExtras: {
          prerequisites: prev.courseExtras?.prerequisites ?? [],
          objective: [...(prev.courseExtras?.objective ?? []), objectiveInput.trim()],
        },
      }))
      setObjectiveInput("")
    }
  }

  const removeObjective = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      courseExtras: {
        prerequisites: prev.courseExtras?.prerequisites ?? [],
        objective: (prev.courseExtras?.objective ?? []).filter((_, i) => i !== index),
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (modalMode === "create") {
        const res = await createCourse(formData)
        if(!res.success || !res.data){
            toast.error(res.error)
            return
        } 

      const newCourse: Course = {
        id: res.data.id,
        ...formData,
        activeId: res.data.semesterCourse[0]?.id || null, // Assuming the first semester course is the active one
      }

      setCourses([...courses, newCourse])
      toast.success('Course created Succesfully')
    } else if (modalMode === "edit" && selectedCourse) {
        const res = await updateCourse(formData)
        if(!res.success || !res.data){
            toast.error(res.error)
            return
        }
      setCourses(courses.map((course) => (course.id === selectedCourse.id ? { ...course, ...formData } : course)))
      toast.success('Course updated Succesfully')
    }

    closeModal()
  }

  const handleDelete =async () => {
    if (selectedCourse) {
      const res = await deleteCourse(selectedCourse.id!)
      if(!res.success){
        toast.error(res.error)
      }
      setCourses(courses.filter((course) => course.id !== selectedCourse.id))
      toast.success('Deleted successfully')
      closeModal()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600">Manage university courses and their details</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => openModal("create")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Course</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Courses</h3>
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-gray-500">All courses</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Active Courses</h3>
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold">{courses.filter((c) => c.status === "active").length}</div>
              <p className="text-xs text-gray-500">Currently active</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Upcoming Courses</h3>
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold">{courses.filter((c) => c.status === "upcomming").length}</div>
              <p className="text-xs text-gray-500">Starting soon</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Credits</h3>
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold">{courses.reduce((sum, c) => sum + c.credits, 0)}</div>
              <p className="text-xs text-gray-500">Credit hours</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Courses</h2>
                <p className="text-gray-600">Manage all university courses and their information</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
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
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Courses Table */}
            <div className="rounded-md border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instructor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{course.name}</div>
                          <div className="text-sm text-gray-500">{course.code}</div>
                          <div className="text-xs text-gray-400">{course.room}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.department.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.instructor?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.schedule}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.credits}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}
                        >
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openModal("view", course)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View Details"
                          >
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
                          </button>
                          <button
                            onClick={() => openModal("edit", course)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Edit Course"
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
                            onClick={() => openModal("delete", course)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete Course"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {modalMode === "create" && "Add New Course"}
                    {modalMode === "edit" && "Edit Course"}
                    {modalMode === "view" && "Course Details"}
                    {modalMode === "delete" && "Delete Course"}
                  </h2>
                  <p className="text-gray-600">
                    {modalMode === "create" && "Create a new course"}
                    {modalMode === "edit" && "Update course information"}
                    {modalMode === "view" && "View complete course details"}
                    {modalMode === "delete" && "Are you sure you want to delete this course?"}
                  </p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {modalMode === "delete" ? (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Warning</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>
                            This will permanently delete the course "{selectedCourse?.name}" ({selectedCourse?.code})
                            and all associated data.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDelete}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium"
                    >
                      Delete Course
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : modalMode === "view" ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Basic Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Course ID:</span>
                          <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{selectedCourse?.id}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Course Name:</span>
                          <p className="font-medium">{selectedCourse?.name}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Course Code:</span>
                          <p className="font-medium">{selectedCourse?.code}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Department:</span>
                          <p className="font-medium">{selectedCourse?.department.name}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Instructor:</span>
                          <p className="font-medium">{selectedCourse?.instructor?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Credits:</span>
                          <p className="font-medium">{selectedCourse?.credits}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Status:</span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCourse?.status || "active")}`}
                          >
                            {selectedCourse?.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Schedule & Location</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Schedule:</span>
                          <p className="font-medium">{selectedCourse?.schedule}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Room:</span>
                          <p className="font-medium">{selectedCourse?.room}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Course Info:</span>
                          <p className="font-medium">{selectedCourse?.courseInfo}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Prerequisites</h3>
                      <div className="space-y-1">
                        {selectedCourse?.courseExtras?.prerequisites?.map((prereq, index) => (
                          <div key={index} className="bg-blue-50 px-2 py-1 rounded text-sm">
                            {prereq}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Learning Objectives</h3>
                      <div className="space-y-1">
                        {selectedCourse?.courseExtras?.objective?.map((obj, index) => (
                          <div key={index} className="bg-green-50 px-2 py-1 rounded text-sm">
                            {obj}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter course name"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        placeholder="Enter course code"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <select
                        value={formData.department.id}
                        onChange={handleDepartmentChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Department</option>
                        {Departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {
                        formData.status == 'active' && (<div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                      <select
                        value={formData.instructor?.id || ''}
                        onChange={handleInstructorChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Instructor</option>
                        {Instructors.map((inst) => (
                          <option key={inst.id} value={inst.id}>
                            {inst.name}
                          </option>
                        ))}
                      </select>
                    </div>)
                    }
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {
                        formData.status == 'active' && (<>
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                      <input
                        type="text"
                        name="schedule"
                        value={formData.schedule}
                        onChange={handleInputChange}
                        placeholder="Mon, Wed, Fri 10:00-11:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                      <input
                        type="text"
                        name="room"
                        value={formData.room}
                        onChange={handleInputChange}
                        placeholder="Room 101"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                        </>)
                    }
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                      <input
                        type="number"
                        name="credits"
                        value={formData.credits}
                        onChange={handleInputChange}
                        placeholder="3"
                        min="1"
                        max="6"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Information</label>
                    <textarea
                      name="courseInfo"
                      value={formData.courseInfo}
                      onChange={handleInputChange}
                      placeholder="Enter course description and information"
                      rows={3}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="upcomming">Upcoming</option>
                    </select>
                  </div>

                  {/* Prerequisites Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prerequisites</label>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={prerequisiteInput}
                          onChange={(e) => setPrerequisiteInput(e.target.value)}
                          placeholder="Add prerequisite"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={addPrerequisite}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.courseExtras?.prerequisites.map((prereq, index) => (
                          <div key={index} className="bg-blue-100 px-2 py-1 rounded-md flex items-center space-x-2">
                            <span className="text-sm">{prereq}</span>
                            <button
                              type="button"
                              onClick={() => removePrerequisite(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Objectives Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Learning Objectives</label>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={objectiveInput}
                          onChange={(e) => setObjectiveInput(e.target.value)}
                          placeholder="Add learning objective"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={addObjective}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.courseExtras?.objective.map((obj, index) => (
                          <div key={index} className="bg-green-100 px-2 py-1 rounded-md flex items-center space-x-2">
                            <span className="text-sm">{obj}</span>
                            <button
                              type="button"
                              onClick={() => removeObjective(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                    >
                      {modalMode === "create" ? "Create Course" : "Update Course"}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
