"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  getCurrentAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  uploadAdminAvatar,
  getDepartmentOptions,
  getAdminRoleOptions,
  getAdminActivityLog,
} from "@/app/actions/admin/setting.action"
import { UploadService } from "@/app/services/UploadService"
import { toast } from "sonner"

// Settings types
export type AdminProfile = {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  department: string
  avatar?: string
  joinDate: string
  lastLogin: string
  nationality?: string
  address?: string
}

export type ActivityLogEntry = {
  id: string
  action: string
  timestamp: string
  details: string
  ipAddress: string
  userAgent: string
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "security" | "activity">("profile")
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ value: string; label: string }>>([])
  const [roleOptions, setRoleOptions] = useState<Array<{ value: string; label: string }>>([])
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadProfileData()
    loadOptions()
  }, [])

  useEffect(() => {
    if (activeTab === "activity") {
      loadActivityLog()
    }
  }, [activeTab])

  const loadProfileData = async () => {
    try {
      setIsLoading(true)
      const result = await getCurrentAdminProfile()
      if (result.success) {
        setProfile(result.data as any)
      } else {
        setError(result.error || "Failed to load profile")
      }
    } catch (err) {
      setError("Failed to load profile")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadOptions = async () => {
    try {
      const [deptResult, roleResult] = await Promise.all([getDepartmentOptions(), getAdminRoleOptions()])

      if (deptResult.success) {
        setDepartmentOptions(deptResult.data as any)
      }
      if (roleResult.success) {
        setRoleOptions(roleResult.data as any)
      }
    } catch (err) {
      console.error("Failed to load options:", err)
    }
  }

  const loadActivityLog = async () => {
    try {
      const result = await getAdminActivityLog()
      if (result.success) {
        setActivityLog(result.data as any)
      }
    } catch (err) {
      console.error("Failed to load activity log:", err)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await updateAdminProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phoneNumber: profile.phone,
        role: getRoleValueFromLabel(profile.role),
        nationality: profile.nationality,
        address: profile.address,
      })

      if (result.success) {
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
        // Reload profile to get updated data
        await loadProfileData()
      } else {
        setError(result.error || "Failed to update profile")
      }
    } catch (err) {
      setError("Failed to update profile")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords don't match!")
      return
    }

    if (passwordData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long!")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await changeAdminPassword(passwordData)

      if (result.success) {
        setShowSuccessMessage(true)
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        setTimeout(() => setShowSuccessMessage(false), 3000)
      } else {
        setError(result.error || "Failed to change password")
      }
    } catch (err) {
      setError("Failed to change password")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (file.size > 1024 * 1024 * 3) {
      setError("File size must be less than 3MB")
      return
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    setAvatarFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAvatarSave = async () => {
    if (!avatarFile ) return

    setIsLoading(true)
    setError(null)

    try {
      // Convert file to base64
      const fileUploaded = await UploadService.uploadFile(avatarFile)
      if(!fileUploaded.success || !fileUploaded.metadata){
        toast.error('failed to upload the avatar')
      }

        const result = await uploadAdminAvatar({
          fileName: avatarFile.name,
          fileType: avatarFile.type,
          fileSize: avatarFile.size,
          fileUrl: fileUploaded.metadata?.fileUrl!
        })

        if (result.success) {
          setShowSuccessMessage(true)
          setAvatarFile(null)
          setAvatarPreview(null)
          setTimeout(() => setShowSuccessMessage(false), 3000)
          await loadProfileData()
        } else {
          setError(result.error || "Failed to upload avatar")
        }
        setIsLoading(false)
      
    
    } catch (err) {
      setError("Failed to upload avatar")
      setIsLoading(false)
      console.error(err)
    }
  }

  const getRoleValueFromLabel = (label: string): any => {
    const role = roleOptions.find((r) => r.label === label)
    return role?.value || "admin"
  }

  const tabs = [
    { id: "profile", name: "Profile", icon: "👤" },
    { id: "password", name: "Password", icon: "🔑" },
    { id: "security", name: "Security", icon: "🛡️" },
    { id: "activity", name: "Activity", icon: "📊" },
  ]

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>
          {showSuccessMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Settings updated successfully!</span>
            </div>
          )}
        </div>

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
                <span className="sr-only">Close</span>×
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Profile Tab */}
              {activeTab === "profile" && profile && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <p className="text-gray-600">Update your personal information and contact details</p>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center space-x-6">
                      <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {avatarPreview || profile.avatar ? (
                          <img
                            src={avatarPreview || profile.avatar}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <svg
                            className="h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <div className="flex space-x-2">
                          <label
                            htmlFor="avatar-upload"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
                          >
                            Change Avatar
                          </label>
                          {avatarFile && (
                            <button
                              type="button"
                              onClick={handleAvatarSave}
                              disabled={isLoading}
                              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                              Save Avatar
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">JPG, GIF or PNG. 1MB max.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={profile.firstName}
                          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={profile.lastName}
                          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                          value={profile.role}
                          onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {roleOptions.map((role) => (
                            <option key={role.value} value={role.label}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select
                          value={profile.department}
                          onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {departmentOptions.map((dept) => (
                            <option key={dept.value} value={dept.value}>
                              {dept.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                        <input
                          type="text"
                          value={profile.nationality || ""}
                          onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                          type="text"
                          value={profile.address || ""}
                          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium flex items-center space-x-2"
                      >
                        {isLoading && (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        )}
                        <span>Update Profile</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === "password" && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                    <p className="text-gray-600">Update your password to keep your account secure</p>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                        minLength={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">Must be at least 8 characters long</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                        minLength={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

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
                          <h3 className="text-sm font-medium text-blue-800">Password Requirements</h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>At least 8 characters long</li>
                              <li>Include uppercase and lowercase letters</li>
                              <li>Include at least one number</li>
                              <li>Include at least one special character</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium flex items-center space-x-2"
                      >
                        {isLoading && (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        )}
                        <span>Change Password</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                    <p className="text-gray-600">Manage your account security and login preferences</p>
                  </div>

                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-md p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Add an extra layer of security to your account by requiring a verification code in addition to
                        your password.
                      </p>
                      <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        Enable 2FA
                      </button>
                    </div>

                    <div className="border border-gray-200 rounded-md p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Login Notifications</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Get notified when someone logs into your account from a new device or location.
                      </p>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm" />
                        <span className="ml-2 text-sm text-gray-700">Send email notifications for new logins</span>
                      </label>
                    </div>

                    <div className="border border-gray-200 rounded-md p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Session Management</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Manage your active sessions and log out from all devices.
                      </p>
                      <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        Log Out All Devices
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === "activity" && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Account Activity</h2>
                    <p className="text-gray-600">View your recent account activity and login history</p>
                  </div>

                  <div className="space-y-4">
                    {activityLog.map((activity) => (
                      <div key={activity.id} className="border border-gray-200 rounded-md p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{activity.action}</h3>
                          <span className="text-sm text-gray-500">{new Date(activity.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{activity.details}</p>
                        <div className="text-xs text-gray-500">
                          <span>IP: {activity.ipAddress}</span>
                          <span className="mx-2">•</span>
                          <span>{activity.userAgent.substring(0, 50)}...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
