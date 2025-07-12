"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  createNotification,
  getNotifications,
  updateNotification,
  deleteNotification,
  sendNotificationNow,
  getNotificationStats,
} from "@/app/actions/admin/notification.action"

// Keep your existing types
export type NotificationType = 'ANNOUNCEMENT'| 'ALERT'| 'REMINDER'| 'SYSTEM'| 'ACADEMIC'
export type NotificationPriority = 'LOW'| 'MEDIUM'| 'HIGH'| 'URGENT'
export type NotificationTarget = 'ALL'| 'STUDENTS'| 'TEACHERS'| 'STAFF'| 'DEPARTMENT'

export type Notification = {
  _id: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  target: NotificationTarget
  targetDetails?: string
  createdBy: string
  createdAt: string
  scheduledFor?: string
  status: 'DRAFT'| 'SCHEDULED'| 'SENT'| 'FAILED'
  recipients?: number
  readCount?: number
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | "delete">("create")
  const [filterType, setFilterType] = useState<NotificationType | "ALL">("ALL")
  const [filterStatus, setFilterStatus] = useState<'DRAFT'| 'SCHEDULED'| 'SENT'| 'FAILED'|"ALL">("ALL")
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    scheduled: 0,
    draft: 0,
    failed: 0,
  })
  const [formData, setFormData] = useState<
    Omit<Notification, "_id" | "createdAt" | "createdBy" | "recipients" | "readCount">
  >({
    title: "",
    message: "",
    type: "ANNOUNCEMENT",
    priority: "MEDIUM",
    target: "ALL",
    targetDetails: "",
    scheduledFor: "",
    status: "DRAFT",
  })

  // Load notifications and stats on component mount
  useEffect(() => {
    loadNotifications()
    loadStats()
  }, [filterType, filterStatus, searchTerm])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const result = await getNotifications(1, 50, {
        search: searchTerm,
        type: filterType,
        status: filterStatus,
      })

      if (result.success) {
        setNotifications(result.data as any)
      } else {
        setError(result.error || "Failed to load notifications")
      }
    } catch (err) {
      setError("Failed to load notifications")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const result = await getNotificationStats()
      if (result.success) {
        setStats(result.data as any)
      }
    } catch (err) {
      console.error("Failed to load stats:", err)
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch =
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "ALL" || notif.type === filterType
    const matchesStatus = filterStatus === "ALL" || notif.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "ANNOUNCEMENT":
        return "bg-blue-100 text-blue-800"
      case "ALERT":
        return "bg-red-100 text-red-800"
      case "REMINDER":
        return "bg-yellow-100 text-yellow-800"
      case "SYSTEM":
        return "bg-gray-100 text-gray-800"
      case 'ACADEMIC':
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'URGENT':
        return "bg-red-100 text-red-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: Notification["status"]) => {
    switch (status) {
      case "SENT":
        return "bg-green-100 text-green-800"
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800"
      case "DRAFT":
        return "bg-gray-100 text-gray-800"
      case "FAILED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const openModal = (mode: "create" | "edit" | "view" | "delete", notification?: Notification) => {
    setModalMode(mode)
    if (notification) {
      setSelectedNotification(notification)
      setFormData({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        target: notification.target,
        targetDetails: notification.targetDetails || "",
        scheduledFor: notification.scheduledFor || "",
        status: notification.status,
      })
    } else {
      setFormData({
        title: "",
        message: "",
        type: "ANNOUNCEMENT",
        priority: "MEDIUM",
        target: "ALL",
        targetDetails: "",
        scheduledFor: "",
        status: "DRAFT",
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedNotification(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let result
      if (modalMode === "create") {
        result = await createNotification({
          
          ...formData,
          status:formData.status.toUpperCase() as any,
          type:formData.type.toUpperCase() as any,
          priority:formData.priority.toUpperCase() as any
        })
      } else if (modalMode === "edit" && selectedNotification) {
        result = await updateNotification({
          ...formData,
          id: selectedNotification._id,
          type:formData.type.toUpperCase() as any,
        } as any)
      }

      if (result?.success) {
        await loadNotifications()
        await loadStats()
        closeModal()
      } else {
        setError(result?.error || "Operation failed")
      }
    } catch (err) {
      setError("Operation failed")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedNotification) return

    setLoading(true)
    try {
      const result = await deleteNotification(selectedNotification._id)
      if (result.success) {
        await loadNotifications()
        await loadStats()
        closeModal()
      } else {
        setError(result.error || "Failed to delete notification")
      }
    } catch (err) {
      setError("Failed to delete notification")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendNow = async (notification: Notification) => {
    setLoading(true)
    try {
      const result = await sendNotificationNow(notification._id)
      if (result.success) {
        await loadNotifications()
        await loadStats()
      } else {
        setError(result.error || "Failed to send notification")
      }
    } catch (err) {
      setError("Failed to send notification")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getEstimatedRecipients = (target: NotificationTarget) => {
    switch (target) {
      case "ALL":
        return 2100
      case "STUDENTS":
        return 1800
      case "TEACHERS":
        return 45
      case "STAFF":
        return 255
      case "DEPARTMENT":
        return 25
      default:
        return 0
    }
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Error Display */}
        {error && (
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
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Send and manage notifications to students, teachers, and staff</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => openModal("create")}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Notification</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Notifications</h3>
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h8V9H4v2z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500">All notifications</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Sent</h3>
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
              <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
              <p className="text-xs text-gray-500">Successfully sent</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Scheduled</h3>
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
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
              <p className="text-xs text-gray-500">Scheduled to send</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Drafts</h3>
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
              <p className="text-xs text-gray-500">Draft notifications</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Failed</h3>
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
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <p className="text-xs text-gray-500">Failed to send</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                <p className="text-gray-600">Manage all system notifications and announcements</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as NotificationType | "ALL")}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="announcement">Announcement</option>
                  <option value="alert">Alert</option>
                  <option value="reminder">Reminder</option>
                  <option value="system">System</option>
                  <option value="academic">Academic</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
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
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Notifications Table */}
            <div className="rounded-md border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <tr key={notification._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="font-medium text-gray-900 truncate">{notification.title}</div>
                          <div className="text-sm text-gray-500 truncate">{notification.message}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}
                          >
                            {notification.type}
                          </span>
                          <br />
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(notification.priority)}`}
                          >
                            {notification.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{notification.target}</div>
                        {notification.targetDetails && (
                          <div className="text-sm text-gray-500">{notification.targetDetails}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notification.status)}`}
                        >
                          {notification.status}
                        </span>
                        {notification.recipients && (
                          <div className="text-xs text-gray-500 mt-1">
                            {notification.readCount}/{notification.recipients} read
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">{notification.createdBy}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openModal("view", notification)}
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
                          {(notification.status === "DRAFT" || notification.status === "SCHEDULED") && (
                            <>
                              <button
                                onClick={() => openModal("edit", notification)}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Edit"
                                disabled={loading}
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
                                onClick={() => handleSendNow(notification)}
                                className="text-purple-600 hover:text-purple-800 p-1"
                                title="Send Now"
                                disabled={loading}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                  />
                                </svg>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openModal("delete", notification)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete"
                            disabled={loading}
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

              {filteredNotifications.length === 0 && !loading && (
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
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications found</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new notification.</p>
                </div>
              )}
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
                    {modalMode === "create" && "Create Notification"}
                    {modalMode === "edit" && "Edit Notification"}
                    {modalMode === "view" && "Notification Details"}
                    {modalMode === "delete" && "Delete Notification"}
                  </h2>
                  <p className="text-gray-600">
                    {modalMode === "create" && "Create a new notification to send to users"}
                    {modalMode === "edit" && "Update notification details"}
                    {modalMode === "view" && "View complete notification information"}
                    {modalMode === "delete" && "Are you sure you want to delete this notification?"}
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
                            This will permanently delete the notification "{selectedNotification?.title}" and cannot be
                            undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 px-4 rounded-md font-medium"
                    >
                      {loading ? "Deleting..." : "Delete Notification"}
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : modalMode === "view" && selectedNotification ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Notification Details</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Title:</span>
                          <p className="font-medium">{selectedNotification.title}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Message:</span>
                          <p className="font-medium bg-gray-50 p-3 rounded-md">{selectedNotification.message}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Type:</span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedNotification.type)}`}
                          >
                            {selectedNotification.type}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Priority:</span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedNotification.priority)}`}
                          >
                            {selectedNotification.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Delivery Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Target:</span>
                          <p className="font-medium capitalize">{selectedNotification.target}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Status:</span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedNotification.status)}`}
                          >
                            {selectedNotification.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Created By:</span>
                          <p className="font-medium">{selectedNotification.createdBy}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Created At:</span>
                          <p className="font-medium">{new Date(selectedNotification.createdAt).toLocaleString()}</p>
                        </div>
                        {selectedNotification.scheduledFor && (
                          <div>
                            <span className="text-sm text-gray-600">Scheduled For:</span>
                            <p className="font-medium">
                              {new Date(selectedNotification.scheduledFor).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {selectedNotification.recipients && (
                          <div>
                            <span className="text-sm text-gray-600">Recipients:</span>
                            <p className="font-medium">{selectedNotification.recipients} users</p>
                          </div>
                        )}
                        {selectedNotification.readCount !== undefined && (
                          <div>
                            <span className="text-sm text-gray-600">Read Count:</span>
                            <p className="font-medium">
                              {selectedNotification.readCount} / {selectedNotification.recipients} (
                              {Math.round(
                                (selectedNotification.readCount / (selectedNotification.recipients || 1)) * 100,
                              )}
                              %)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter notification title"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as NotificationType })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="announcement">Announcement</option>
                        <option value="alert">Alert</option>
                        <option value="reminder">Reminder</option>
                        <option value="system">System</option>
                        <option value="academic">Academic</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Enter notification message"
                      rows={4}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as NotificationPriority })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                      <select
                        value={formData.target}
                        onChange={(e) => setFormData({ ...formData, target: e.target.value as NotificationTarget })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Users</option>
                        <option value="students">Students</option>
                        <option value="teachers">Teachers</option>
                        <option value="staff">Staff</option>
                        <option value="department">Department</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                    </div>
                  </div>
                  {formData.target === "DEPARTMENT" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department Details</label>
                      <input
                        type="text"
                        value={formData.targetDetails}
                        onChange={(e) => setFormData({ ...formData, targetDetails: e.target.value })}
                        placeholder="Specify department name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                  {formData.status === "SCHEDULED" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Schedule For</label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledFor}
                        onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
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
                        <h3 className="text-sm font-medium text-blue-800">Estimated Recipients</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            This notification will be sent to approximately {getEstimatedRecipients(formData.target)}{" "}
                            users.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 px-4 rounded-md font-medium"
                    >
                      {loading
                        ? modalMode === "create"
                          ? "Creating..."
                          : "Updating..."
                        : modalMode === "create"
                          ? "Create Notification"
                          : "Update Notification"}
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
