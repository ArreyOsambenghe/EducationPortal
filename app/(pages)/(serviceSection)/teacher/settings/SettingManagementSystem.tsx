"use client"

import { useState } from "react"

// Types
type TeacherProfile = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  position: string
  employeeId: string
  joinDate: string
  officeLocation: string
  officeHours: string
  bio: string
  education: Education[]
  experience: Experience[]
  publications: Publication[]
  courses: string[]
  specializations: string[]
  profileImage?: string
}

type Education = {
  id: string
  degree: string
  institution: string
  year: string
  field: string
}

type Experience = {
  id: string
  position: string
  organization: string
  startDate: string
  endDate?: string
  description: string
}

type Publication = {
  id: string
  title: string
  journal: string
  year: string
  authors: string[]
  doi?: string
}

// Mock data
const mockProfile: TeacherProfile = {
  id: "t001",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@university.edu",
  phone: "+1 (555) 123-4567",
  department: "Computer Science",
  position: "Associate Professor",
  employeeId: "EMP001",
  joinDate: "2018-08-15",
  officeLocation: "Room 205, CS Building",
  officeHours: "Mon, Wed, Fri 2:00-4:00 PM",
  bio: "Dr. John Doe is an Associate Professor in the Computer Science Department with over 10 years of experience in database systems, machine learning, and software engineering. He has published numerous papers in top-tier conferences and journals.",
  education: [
    {
      id: "edu1",
      degree: "Ph.D. in Computer Science",
      institution: "Stanford University",
      year: "2015",
      field: "Database Systems",
    },
    {
      id: "edu2",
      degree: "M.S. in Computer Science",
      institution: "MIT",
      year: "2010",
      field: "Software Engineering",
    },
    {
      id: "edu3",
      degree: "B.S. in Computer Science",
      institution: "UC Berkeley",
      year: "2008",
      field: "Computer Science",
    },
  ],
  experience: [
    {
      id: "exp1",
      position: "Associate Professor",
      organization: "University",
      startDate: "2020-08-01",
      description:
        "Teaching undergraduate and graduate courses, conducting research in database systems and machine learning.",
    },
    {
      id: "exp2",
      position: "Assistant Professor",
      organization: "University",
      startDate: "2018-08-15",
      endDate: "2020-07-31",
      description: "Taught introductory and advanced computer science courses, established research lab.",
    },
    {
      id: "exp3",
      position: "Senior Software Engineer",
      organization: "Google",
      startDate: "2015-06-01",
      endDate: "2018-07-31",
      description: "Worked on large-scale distributed systems and database optimization.",
    },
  ],
  publications: [
    {
      id: "pub1",
      title: "Efficient Query Processing in Distributed Database Systems",
      journal: "ACM Transactions on Database Systems",
      year: "2023",
      authors: ["John Doe", "Jane Smith", "Bob Johnson"],
      doi: "10.1145/3588432",
    },
    {
      id: "pub2",
      title: "Machine Learning Approaches for Database Optimization",
      journal: "IEEE Transactions on Knowledge and Data Engineering",
      year: "2022",
      authors: ["John Doe", "Alice Brown"],
      doi: "10.1109/TKDE.2022.3156789",
    },
  ],
  courses: [
    "CS301 - Database Systems",
    "CS302 - Data Structures and Algorithms",
    "CS401 - Software Engineering",
    "CS402 - Computer Networks",
  ],
  specializations: ["Database Systems", "Machine Learning", "Distributed Systems", "Software Engineering"],
}

export default function TeacherProfile() {
  const [profile, setProfile] = useState<TeacherProfile>(mockProfile)
  const [activeTab, setActiveTab] = useState<"overview" | "education" | "experience" | "publications" | "settings">(
    "overview",
  )
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(profile)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const handleSaveProfile = () => {
    setProfile(editForm)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditForm(profile)
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage || "/placeholder.svg"}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-blue-600">
                    {profile.firstName[0]}
                    {profile.lastName[0]}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Dr. {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-lg text-gray-600">{profile.position}</p>
                <p className="text-gray-600">{profile.department} Department</p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>Employee ID: {profile.employeeId}</span>
                  <span>•</span>
                  <span>Joined: {new Date(profile.joinDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{profile.courses.length}</div>
              <div className="text-sm text-gray-600">Active Courses</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{profile.publications.length}</div>
              <div className="text-sm text-gray-600">Publications</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{profile.experience.length}</div>
              <div className="text-sm text-gray-600">Work Experience</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{profile.specializations.length}</div>
              <div className="text-sm text-gray-600">Specializations</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "overview", label: "Overview" },
                { id: "education", label: "Education" },
                { id: "experience", label: "Experience" },
                { id: "publications", label: "Publications" },
                { id: "settings", label: "Settings" },
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
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Office Location</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.officeLocation}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, officeLocation: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.officeLocation}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Office Hours</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.officeHours}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, officeHours: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.officeHours}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Biography</h3>
                  {isEditing ? (
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700">{profile.bio}</p>
                  )}
                </div>

                {/* Current Courses */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Courses</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profile.courses.map((course, index) => (
                      <div key={index} className="bg-blue-50 p-3 rounded-lg">
                        <p className="font-medium text-blue-900">{course}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specializations */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.specializations.map((spec, index) => (
                      <span
                        key={index}
                        className="inline-flex px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "education" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Add Education
                  </button>
                </div>
                <div className="space-y-4">
                  {profile.education.map((edu) => (
                    <div key={edu.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                          <p className="text-gray-600">{edu.institution}</p>
                          <p className="text-sm text-gray-500">
                            {edu.field} • {edu.year}
                          </p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "experience" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Add Experience
                  </button>
                </div>
                <div className="space-y-4">
                  {profile.experience.map((exp) => (
                    <div key={exp.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                          <p className="text-gray-600">{exp.organization}</p>
                          <p className="text-sm text-gray-500">
                            {exp.startDate} - {exp.endDate || "Present"}
                          </p>
                          <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "publications" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Publications</h3>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Add Publication
                  </button>
                </div>
                <div className="space-y-4">
                  {profile.publications.map((pub) => (
                    <div key={pub.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{pub.title}</h4>
                          <p className="text-gray-600">
                            {pub.journal} • {pub.year}
                          </p>
                          <p className="text-sm text-gray-500">Authors: {pub.authors.join(", ")}</p>
                          {pub.doi && <p className="text-sm text-blue-600 mt-1">DOI: {pub.doi}</p>}
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Change Password</h4>
                        <p className="text-sm text-gray-600">Update your account password</p>
                      </div>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Change Password
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-600">Receive notifications about course updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      </div>
                      <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Profile Visibility</h4>
                        <p className="text-sm text-gray-600">Control who can see your profile information</p>
                      </div>
                      <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>Public</option>
                        <option>Students Only</option>
                        <option>Faculty Only</option>
                        <option>Private</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                  <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                    >
                      Update Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
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
      </div>
    </div>
  )
}
