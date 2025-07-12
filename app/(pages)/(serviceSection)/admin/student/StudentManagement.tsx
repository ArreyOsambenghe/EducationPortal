"use client"

import { findProgramById } from "@/app/actions/admin/academic.action"
import { admitStudent, generateAdmissionPdf, sendAdmissionEmail, updateStudentRegistrationProccess, verifiedStudentDocument } from "@/app/actions/admin/student.action"
import { useState } from "react"
import { toast } from "sonner"

// Types based on your Prisma model
type UserFile = {
  id: string
  fileName: string
  fileType: string
  fileUrl: string
  uploadedAt: string
  verified: boolean
}

type Student = {
  id: string
  firstName: string
  lastName: string
  phoneNumber?: string
  email: string
  dof: string
  sex: string
  nationality: string
  address?: string
  previousSchool?: string
  previousSchoolAddress?: string
  moreAboutYourself?: string
  GCEAdvancedLevelResult?: string
  createdAt: string
  updatedAt: string
  admisionRequestDocument: UserFile[]
  status: string
  registratioProcess: string
  matricule?: string // Generated during admission
  programId:string|null
}

type Props  = {
    initialStudents: Student[]
    adminEmail: string
}

export default function StudentAdmissionManagement({initialStudents,adminEmail}:Props) {
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"view" | "documents" | "admit" | "letter">("view")
  const [selectedDocument, setSelectedDocument] = useState<UserFile | null>(null)
  const [sendMailLoading,setSendLoading] = useState(false)

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.matricule && student.matricule.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || student.registratioProcess === statusFilter

    return matchesSearch && matchesStatus
  })

  const sendAdmissionLetter = async (student: Student) => {
    const program = await findProgramById(student.programId!)
    if(!program.success || !program.data){
        toast.error("Program not found for the student.")
        return
    }
    const admissionPdf = await generateAdmissionPdf(`${student.firstName} ${student.lastName}`,program.data.name,student.matricule!,adminEmail)
    if (!admissionPdf.success || !admissionPdf.data) {
      toast.error("Failed to generate admission letter: " + admissionPdf.error)
      return
    }
    const fileUrl = admissionPdf.data.fileUrl
    const res = await sendAdmissionEmail('choclark6@gmail.com', `${student.firstName} ${student.lastName}`, program.data.name, student.matricule!, `${process.env.NEXT_PUBLIC_BASE_URL}${fileUrl}`)
    if (!res.success) {
      toast.error("Failed to send admission letter: " + res.error)
      return
    }
    toast.success("Admission letter sent successfully!")
}

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "documents_verified":
        return "bg-blue-100 text-blue-800"
      case "admitted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending Review"
      case "documents_verified":
        return "Documents Verified"
      case "admitted":
        return "Admitted"
      case "rejected":
        return "Rejected"
      default:
        return status
    }
  }

  const generateMatricule = () => {
    const year = new Date().getFullYear()
    const existingMatricules = students.filter((s) => s.matricule).map((s) => s.matricule!)
    let counter = 1
    let newMatricule = `MAT${year}${counter.toString().padStart(3, "0")}`

    while (existingMatricules.includes(newMatricule)) {
      counter++
      newMatricule = `MAT${year}${counter.toString().padStart(3, "0")}`
    }

    return newMatricule
  }

  const openModal = (mode: "view" | "documents" | "admit" | "letter", student: Student) => {
    setModalMode(mode)
    setSelectedStudent(student)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedStudent(null)
    setSelectedDocument(null)
  }

  const handleAdmitStudent = async () => {
    if (selectedStudent) {
      const matricule = generateMatricule()
      try {
        const res = await admitStudent(selectedStudent.id, matricule)
        if (res.success) {
            setStudents(
        students.map((student) =>
          student.id === selectedStudent.id
            ? { ...student, registratioProcess: "admitted", matricule, updatedAt: new Date().toISOString() }
            : student,
        ),
      )
      toast.success("Student admitted successfully!")
    }
        else {
          toast.error("Failed to admit student: " + res.error)
        }
    } catch (error) {
      toast.error("Failed to admit student.")
    }
    closeModal()
  }
  }

  const handleVerifyDocument = async (documentId: string) => {
    if (selectedStudent) {
        const res = await verifiedStudentDocument(documentId, true)
        if(!res.success ){
          toast.error(res.error)
          return
        }
      const updatedStudent = {
        ...selectedStudent,
        admisionRequestDocument: selectedStudent.admisionRequestDocument.map((doc) =>
          doc.id === documentId ? { ...doc, verified: true } : doc,
        ),
      }

      // Check if all documents are verified
      const allVerified = updatedStudent.admisionRequestDocument.every((doc) => doc.verified)
      if (allVerified && selectedStudent.registratioProcess === "completed") {
        const res = await updateStudentRegistrationProccess(selectedStudent.id, "documents_verified")
        if(!res.success){
          toast.error(res.error)
          return
        }
        updatedStudent.registratioProcess = "documents_verified"
      }

      setStudents(students.map((student) => (student.id === selectedStudent.id ? updatedStudent : student)))
      setSelectedStudent(updatedStudent)
    }
  }

  const handleRejectStudent =async () => {
    if (selectedStudent) {
        const res = await updateStudentRegistrationProccess(selectedStudent.id, "rejected")
        if(!res.success){
          toast.error(res.error)
          return
        }
      setStudents(
        students.map((student) =>
          student.id === selectedStudent.id
            ? { ...student, registratioProcess: "rejected", updatedAt: new Date().toISOString() }
            : student,
        ),
      )
      closeModal()
    }
  }

  const getDocumentIcon = (fileType: string) => {
    switch (fileType) {
      case "GCE Results":
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )
      case "University Transcript":
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Admission Management</h1>
            <p className="text-gray-600">Review applications, verify documents, and manage student admissions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Applications</h3>
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-gray-500">Student applications</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Pending Review</h3>
              <svg className="h-4 w-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {students.filter((s) => s.registratioProcess === "pending").length}
              </div>
              <p className="text-xs text-gray-500">Awaiting review</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Documents Verified</h3>
              <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {students.filter((s) => s.registratioProcess === "documents_verified").length}
              </div>
              <p className="text-xs text-gray-500">Ready for admission</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Admitted</h3>
              <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {students.filter((s) => s.registratioProcess === "admitted").length}
              </div>
              <p className="text-xs text-gray-500">Successfully admitted</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Student Applications</h2>
                <p className="text-gray-600">Review and manage student admission applications</p>
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
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending Review</option>
                  <option value="documents_verified">Documents Verified</option>
                  <option value="admitted">Admitted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="rounded-md border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matricule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                          <div className="text-xs text-gray-400">{student.nationality}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.matricule ? (
                          <div className="font-mono text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                            {student.matricule}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">Not assigned</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">{student.admisionRequestDocument.length}</span>
                          <div className="flex space-x-1">
                            {student.admisionRequestDocument.map((doc) => (
                              <div
                                key={doc.id}
                                className={`w-2 h-2 rounded-full ${doc.verified ? "bg-green-500" : "bg-yellow-500"}`}
                                title={`${doc.fileType}: ${doc.verified ? "Verified" : "Pending"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.registratioProcess)}`}
                        >
                          {getStatusText(student.registratioProcess)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(student.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openModal("view", student)}
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
                            onClick={() => openModal("documents", student)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Review Documents"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </button>
                          {student.registratioProcess === "documents_verified" && (
                            <button
                              onClick={() => openModal("admit", student)}
                              className="text-purple-600 hover:text-purple-800 p-1"
                              title="Admit Student"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          {student.registratioProcess === "admitted" && (
                            <button
                              onClick={() => openModal("letter", student)}
                              className="text-indigo-600 hover:text-indigo-800 p-1"
                              title="Send Letter"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                          )}
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
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {modalMode === "view" && "Student Details"}
                    {modalMode === "documents" && "Document Review"}
                    {modalMode === "admit" && "Admit Student"}
                    {modalMode === "letter" && "Send Admission Letter"}
                  </h2>
                  <p className="text-gray-600">
                    {selectedStudent.firstName} {selectedStudent.lastName} - {selectedStudent.email}
                  </p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {modalMode === "view" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Personal Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Full Name:</span>
                          <p className="font-medium">
                            {selectedStudent.firstName} {selectedStudent.lastName}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Email:</span>
                          <p className="font-medium">{selectedStudent.email}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Phone:</span>
                          <p className="font-medium">{selectedStudent.phoneNumber || "Not provided"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Date of Birth:</span>
                          <p className="font-medium">{selectedStudent.dof}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Gender:</span>
                          <p className="font-medium">{selectedStudent.sex}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Nationality:</span>
                          <p className="font-medium">{selectedStudent.nationality}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Address:</span>
                          <p className="font-medium">{selectedStudent.address || "Not provided"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Academic Background</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Previous School:</span>
                          <p className="font-medium">{selectedStudent.previousSchool || "Not provided"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">School Address:</span>
                          <p className="font-medium">{selectedStudent.previousSchoolAddress || "Not provided"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">GCE Results:</span>
                          <p className="font-medium">{selectedStudent.GCEAdvancedLevelResult || "Not provided"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">About Yourself:</span>
                          <p className="font-medium">{selectedStudent.moreAboutYourself || "Not provided"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Application Status</h3>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedStudent.registratioProcess)}`}
                      >
                        {getStatusText(selectedStudent.registratioProcess)}
                      </span>
                      {selectedStudent.matricule && (
                        <div className="font-mono text-sm bg-green-100 text-green-800 px-3 py-1 rounded">
                          Matricule: {selectedStudent.matricule}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {modalMode === "documents" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Submitted Documents</h3>
                    <div className="space-y-4">
                      {selectedStudent.admisionRequestDocument.map((document) => (
                        <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getDocumentIcon(document.fileType)}
                              <div>
                                <h4 className="font-medium text-gray-900">{document.fileType}</h4>
                                <p className="text-sm text-gray-600">{document.fileName}</p>
                                <p className="text-xs text-gray-400">
                                  Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {document.verified ? (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Verified
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleVerifyDocument(document.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                >
                                  Verify
                                </button>
                              )}
                              <a href={process.env.NEXT_PUBLIC_BASE_URL+document.fileUrl} target="_blank" className="text-blue-600 hover:text-blue-800 text-sm">View</a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedStudent.admisionRequestDocument.every((doc) => doc.verified) &&
                    selectedStudent.registratioProcess === "pending" && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex">
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">All Documents Verified</h3>
                            <div className="mt-2 text-sm text-green-700">
                              <p>All submitted documents have been verified. Student is ready for admission review.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {modalMode === "admit" && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Admit Student</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            You are about to admit {selectedStudent.firstName} {selectedStudent.lastName}. This action
                            will:
                          </p>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Generate a unique matricule number</li>
                            <li>Change status to "Admitted"</li>
                            <li>Enable sending admission letters</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">Generated Matricule</h4>
                    <div className="font-mono text-lg bg-white border border-gray-300 px-3 py-2 rounded">
                      {generateMatricule()}
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAdmitStudent}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium"
                    >
                      Admit Student
                    </button>
                    <button
                      onClick={handleRejectStudent}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium"
                    >
                      Reject Application
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {modalMode === "letter" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Send Admission Letter</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => sendAdmissionLetter(selectedStudent)} className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>Send Admission Letter</span>
                        </button>
                        
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h4 className="font-medium text-gray-900 mb-2">Letter Preview</h4>
                        <div className="bg-white border border-gray-300 p-4 rounded text-sm">
                          <p className="mb-2">
                            Dear {selectedStudent.firstName} {selectedStudent.lastName},
                          </p>
                          <p className="mb-2">
                            Congratulations! We are pleased to inform you that you have been admitted to our university.
                          </p>
                          <p className="mb-2">
                            Your matricule number is: <strong>{selectedStudent.matricule}</strong>
                          </p>
                          <p className="mb-2">
                            Please find attached your admission letter and enrollment instructions.
                          </p>
                          <p>Welcome to our academic community!</p>
                          <p className="mt-4">
                            Best regards,
                            <br />
                            Admissions Office
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

