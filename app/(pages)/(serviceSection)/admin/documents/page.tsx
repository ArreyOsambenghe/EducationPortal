"use client"

import type React from "react"
import { useState } from "react"

// Document types
export type DocumentType = "admission" | "report" | "transcript" | "certificate" | "application" | "other"

export type DocumentStatus = "pending" | "approved" | "rejected" | "under_review"

export type Document = {
  _id: string
  title: string
  type: DocumentType
  studentId?: string
  studentName?: string
  uploadedBy: string
  uploadDate: string
  fileSize: string
  fileType: string
  status: DocumentStatus
  reviewedBy?: string
  reviewDate?: string
  comments?: string
  downloadUrl: string
}

// Mock data for documents
const initialDocuments: Document[] = [
  {
    _id: "doc_001",
    title: "Admission Application Form",
    type: "admission",
    studentId: "STU001",
    studentName: "John Doe",
    uploadedBy: "John Doe",
    uploadDate: "2024-01-15",
    fileSize: "2.5 MB",
    fileType: "PDF",
    status: "pending",
    downloadUrl: "/documents/admission_001.pdf",
  },
  {
    _id: "doc_002",
    title: "Academic Transcript",
    type: "transcript",
    studentId: "STU002",
    studentName: "Jane Smith",
    uploadedBy: "Jane Smith",
    uploadDate: "2024-01-14",
    fileSize: "1.8 MB",
    fileType: "PDF",
    status: "approved",
    reviewedBy: "Dr. Wilson",
    reviewDate: "2024-01-16",
    comments: "All requirements met",
    downloadUrl: "/documents/transcript_002.pdf",
  },
  {
    _id: "doc_003",
    title: "Medical Certificate",
    type: "certificate",
    studentId: "STU003",
    studentName: "Mike Johnson",
    uploadedBy: "Mike Johnson",
    uploadDate: "2024-01-13",
    fileSize: "0.9 MB",
    fileType: "PDF",
    status: "under_review",
    reviewedBy: "Admin Staff",
    reviewDate: "2024-01-15",
    downloadUrl: "/documents/medical_003.pdf",
  },
  {
    _id: "doc_004",
    title: "Progress Report Q1",
    type: "report",
    studentId: "STU004",
    studentName: "Sarah Wilson",
    uploadedBy: "Dr. Brown",
    uploadDate: "2024-01-12",
    fileSize: "3.2 MB",
    fileType: "PDF",
    status: "approved",
    reviewedBy: "Head of Department",
    reviewDate: "2024-01-14",
    comments: "Excellent progress",
    downloadUrl: "/documents/report_004.pdf",
  },
  {
    _id: "doc_005",
    title: "Birth Certificate",
    type: "certificate",
    studentId: "STU005",
    studentName: "David Lee",
    uploadedBy: "David Lee",
    uploadDate: "2024-01-11",
    fileSize: "1.1 MB",
    fileType: "PDF",
    status: "rejected",
    reviewedBy: "Admin Staff",
    reviewDate: "2024-01-13",
    comments: "Document not clear, please resubmit",
    downloadUrl: "/documents/birth_005.pdf",
  },
]

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"view" | "review" | "delete">("view")
  const [filterType, setFilterType] = useState<DocumentType | "all">("all")
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | "all">("all")
  const [reviewData, setReviewData] = useState({
    status: "pending" as DocumentStatus,
    comments: "",
    reviewedBy: "Admin User",
  })

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || doc.type === filterType
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "under_review":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: DocumentType) => {
    switch (type) {
      case "admission":
        return "bg-purple-100 text-purple-800"
      case "report":
        return "bg-blue-100 text-blue-800"
      case "transcript":
        return "bg-green-100 text-green-800"
      case "certificate":
        return "bg-orange-100 text-orange-800"
      case "application":
        return "bg-pink-100 text-pink-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const openModal = (mode: "view" | "review" | "delete", document: Document) => {
    setModalMode(mode)
    setSelectedDocument(document)
    if (mode === "review") {
      setReviewData({
        status: document.status,
        comments: document.comments || "",
        reviewedBy: "Admin User",
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedDocument(null)
    setReviewData({
      status: "pending",
      comments: "",
      reviewedBy: "Admin User",
    })
  }

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDocument) {
      setDocuments(
        documents.map((doc) =>
          doc._id === selectedDocument._id
            ? {
                ...doc,
                status: reviewData.status,
                comments: reviewData.comments,
                reviewedBy: reviewData.reviewedBy,
                reviewDate: new Date().toISOString().split("T")[0],
              }
            : doc,
        ),
      )
      closeModal()
    }
  }

  const handleDelete = () => {
    if (selectedDocument) {
      setDocuments(documents.filter((doc) => doc._id !== selectedDocument._id))
      closeModal()
    }
  }

  const handleDownload = (doc: Document) => {
    // Simulate download
    const link = document.createElement("a")
    link.href = doc.downloadUrl
    link.download = doc.title
    link.click()
  }

  const getDocumentStats = () => {
    return {
      total: documents.length,
      pending: documents.filter((d) => d.status === "pending").length,
      approved: documents.filter((d) => d.status === "approved").length,
      rejected: documents.filter((d) => d.status === "rejected").length,
      underReview: documents.filter((d) => d.status === "under_review").length,
    }
  }

  const stats = getDocumentStats()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
            <p className="text-gray-600">Manage all uploaded documents and their review status</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Documents</h3>
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500">All documents</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Pending Review</h3>
              <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              <p className="text-xs text-gray-500">Awaiting review</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Approved</h3>
              <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-gray-500">Approved docs</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Under Review</h3>
              <svg className="h-4 w-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.underReview}</div>
              <p className="text-xs text-gray-500">Being reviewed</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Rejected</h3>
              <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-gray-500">Rejected docs</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
                <p className="text-gray-600">Review and manage all uploaded documents</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as DocumentType | "all")}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="admission">Admission</option>
                  <option value="report">Report</option>
                  <option value="transcript">Transcript</option>
                  <option value="certificate">Certificate</option>
                  <option value="application">Application</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as DocumentStatus | "all")}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="under_review">Under Review</option>
                </select>
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
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Documents Table */}
            <div className="rounded-md border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upload Date
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
                  {filteredDocuments.map((document) => (
                    <tr key={document._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <svg
                                className="h-6 w-6 text-gray-600"
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
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{document.title}</div>
                            <div className="text-sm text-gray-500">
                              {document.fileType} • {document.fileSize}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{document.studentName || "N/A"}</div>
                        <div className="text-sm text-gray-500">{document.studentId || "System"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(document.type)}`}
                        >
                          {document.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{document.uploadDate}</div>
                        <div className="text-sm text-gray-500">by {document.uploadedBy}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(document.status)}`}
                        >
                          {document.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openModal("view", document)}
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
                            onClick={() => handleDownload(document)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => openModal("review", document)}
                            className="text-yellow-600 hover:text-yellow-800 p-1"
                            title="Review"
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
                            onClick={() => openModal("delete", document)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete"
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
      {showModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {modalMode === "view" && "Document Details"}
                    {modalMode === "review" && "Review Document"}
                    {modalMode === "delete" && "Delete Document"}
                  </h2>
                  <p className="text-gray-600">
                    {modalMode === "view" && "View complete document information"}
                    {modalMode === "review" && "Review and update document status"}
                    {modalMode === "delete" && "Are you sure you want to delete this document?"}
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
                          <p>This will permanently delete "{selectedDocument.title}" and cannot be undone.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDelete}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium"
                    >
                      Delete Document
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : modalMode === "review" ? (
                <form onSubmit={handleReview} className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Document Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Title:</span>
                          <p className="font-medium">{selectedDocument.title}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Student:</span>
                          <p className="font-medium">{selectedDocument.studentName || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Type:</span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedDocument.type)}`}
                          >
                            {selectedDocument.type}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Upload Date:</span>
                          <p className="font-medium">{selectedDocument.uploadDate}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Review Details</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={reviewData.status}
                          onChange={(e) => setReviewData({ ...reviewData, status: e.target.value as DocumentStatus })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="under_review">Under Review</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                        <textarea
                          value={reviewData.comments}
                          onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Add review comments..."
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                    >
                      Update Review
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
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Document Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Document ID:</span>
                          <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{selectedDocument._id}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Title:</span>
                          <p className="font-medium">{selectedDocument.title}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Type:</span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedDocument.type)}`}
                          >
                            {selectedDocument.type}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">File Size:</span>
                          <p className="font-medium">{selectedDocument.fileSize}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">File Type:</span>
                          <p className="font-medium">{selectedDocument.fileType}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Upload Details</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Student:</span>
                          <p className="font-medium">{selectedDocument.studentName || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Student ID:</span>
                          <p className="font-medium">{selectedDocument.studentId || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Uploaded By:</span>
                          <p className="font-medium">{selectedDocument.uploadedBy}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Upload Date:</span>
                          <p className="font-medium">{selectedDocument.uploadDate}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Status:</span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedDocument.status)}`}
                          >
                            {selectedDocument.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {selectedDocument.reviewedBy && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Review Information</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <span className="text-sm text-gray-600">Reviewed By:</span>
                          <p className="font-medium">{selectedDocument.reviewedBy}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Review Date:</span>
                          <p className="font-medium">{selectedDocument.reviewDate}</p>
                        </div>
                      </div>
                      {selectedDocument.comments && (
                        <div>
                          <span className="text-sm text-gray-600">Comments:</span>
                          <p className="font-medium bg-gray-50 p-3 rounded-md">{selectedDocument.comments}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleDownload(selectedDocument)}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => setModalMode("review")}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md font-medium"
                    >
                      Review Document
                    </button>
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
