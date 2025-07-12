"use client"

import nationalities from "@/app/static/nationality"
import type React from "react"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { getStudentByEmail, studentRegistration } from "@/app/actions/authActions"
import { toast } from "sonner"
import { redirect } from "next/navigation"
import { findProgramIdByName, getPrograms } from "@/app/actions/admin/academic.action"

export default function StudentSignup({email}:{email:string}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [pageLoading,setPageLoading] = useState(true)
  

  const [formData, setFormData] = useState({
    id:'',
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    dof: "",
    sex: "",
    nationality: "",

    address: "",
    previousSchool: "",
    previousSchoolAddress: "",
    moreAboutYourself: "",
    GCEAdvancedLevelResult: "",
    profilePhoto: null as File | null,
    admisionRequestDocument: [] as File[],
    programId: "",
  })

  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>("")
  const [documentFiles, setDocumentFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [programs, setPrograms] = useState<{ id: string; name: string;code:string;  }[]>([])

  const totalSteps = 4

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, profilePhoto: file }))
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setDocumentFiles((prev) => [...prev, ...files])
    setFormData((prev) => ({
      ...prev,
      admisionRequestDocument: [...prev.admisionRequestDocument, ...files],
    }))
  }

  const removeDocument = (index: number) => {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index))
    setFormData((prev) => ({
      ...prev,
      admisionRequestDocument: prev.admisionRequestDocument.filter((_, i) => i !== index),
    }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  useEffect(()=>{
    const fetch = async () => {
      const [user,Programs] = await Promise.all([
        getStudentByEmail(email),
        getPrograms()
      ])
      if(user){
        setFormData(prev => ({...prev,id:user.id,firstName:user.firstName,lastName:user.lastName,email}))
      }
      if(Programs.success && Programs.data){
        setPrograms(Programs.data.map(program => ({
          id: program.id,
          name: program.name,
          code: program.code
        })))
      }
    }
    fetch()
    setPageLoading(false)
  },[email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const {id,...newData} = formData
    const res = await studentRegistration(id,newData)
    if(res.success){
      toast.success(res.message)
      redirect('/student/dashboard')
    }
    else{
      toast.error(res.message)
    }
    setLoading(false)
  }
if(pageLoading){
    return(
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10  animate-spin" />
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Registration</h1>
          <p className="text-gray-600 mt-2">Join our university community</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-6">
            {[
              { step: 1, label: "Personal Details" },
              { step: 2, label: "Background" },
              { step: 3, label: "Academic Info" },
              { step: 4, label: "Documents" },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= item.step
                        ? "bg-blue-500 text-white"
                        : currentStep === item.step
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {item.step}
                  </div>
                  <span
                    className={`ml-3 text-sm font-medium ${
                      currentStep >= item.step ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {index < 3 && <div className="w-8 h-px bg-gray-300 ml-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Personal Information</h2>
                  <p className="text-gray-600">Let's start with your basic information</p>
                  <button type="button" className="text-blue-600 text-sm mt-2 hover:underline">
                    How we'll use your information
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter first name"
                        required
                      />
                      <svg
                        className="absolute right-3 top-3 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter last name"
                        required
                      />
                      <svg
                        className="absolute right-3 top-3 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="student@email.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      name="dof"
                      value={formData.dof}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
                    <select
                      name="sex"
                      value={formData.sex}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Sex</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Background Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Background Information</h2>
                  <p className="text-gray-600">Tell us about your background and location</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                  <select
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Nationality</option>
                    {nationalities.map((nationality) => (
                      <option key={nationality} value={nationality.toLowerCase()}>
                        {nationality}
                      </option>
                    ))}
                  </select>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Program of Study *</label>
                  <select
                    name="programId"
                    value={formData.programId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select your program</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name} ({program.code}) 
                      </option>
                    ))}
                  </select>
                </div>

                {formData.programId && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <h4 className="font-medium text-blue-900">Program Information</h4>
                        {(() => {
                          const selectedProgram = programs.find((p) => p.id === formData.programId)
                          return selectedProgram ? (
                            <div className="text-sm text-blue-700 mt-1">
                              <p>
                                <strong>Code:</strong> {selectedProgram.code}
                              </p>
                              <p>
                                <strong>Program ID:</strong> {selectedProgram.id}
                              </p>
                            </div>
                          ) : null
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address (Optional)</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter your full address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Previous School (Optional)</label>
                  <input
                    type="text"
                    name="previousSchool"
                    value={formData.previousSchool}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Name of your previous school"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Previous School Address (Optional)
                  </label>
                  <textarea
                    name="previousSchoolAddress"
                    value={formData.previousSchoolAddress}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Address of your previous school"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Academic Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Academic Information</h2>
                  <p className="text-gray-600">Share your academic background and tell us about yourself</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GCE Advanced Level Results (Optional)
                  </label>
                  <textarea
                    name="GCEAdvancedLevelResult"
                    value={formData.GCEAdvancedLevelResult}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Please list your GCE A-Level subjects and grades (e.g., Mathematics - A, Physics - B, Chemistry - A)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">More About Yourself (Optional)</label>
                  <textarea
                    name="moreAboutYourself"
                    value={formData.moreAboutYourself}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Tell us about your interests, goals, achievements, extracurricular activities, or anything else you'd like us to know about you..."
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <h4 className="font-medium text-blue-900">Personal Statement Tips</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Use this space to showcase your personality, motivations, and what makes you unique. This helps
                        us understand you beyond your academic achievements.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Upload Documents</h2>
                  <p className="text-gray-600">Upload your profile photo and admission documents</p>
                </div>

                <div className="space-y-6">
                  {/* Profile Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Profile Photo (Optional)</label>
                    <div className="flex items-center space-x-6">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {profilePhotoPreview ? (
                          <img
                            src={profilePhotoPreview || "/placeholder.svg"}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          id="profilePhoto"
                          accept="image/*"
                          onChange={handleProfilePhotoChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="profilePhoto"
                          className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Choose Photo
                        </label>
                        <p className="text-xs text-gray-500 mt-2">JPG, PNG up to 5MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Admission Documents */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Admission Request Documents</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        id="documents"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentChange}
                        className="hidden"
                        multiple
                      />
                      <label htmlFor="documents" className="cursor-pointer">
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
                        <div className="mt-4">
                          <p className="text-lg font-medium text-gray-900">Click to upload documents</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Upload transcripts, certificates, ID copy, etc. (Multiple files allowed)
                          </p>
                          <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG up to 10MB each</p>
                        </div>
                      </label>
                    </div>

                    {/* Document List */}
                    {documentFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Uploaded Documents:</h4>
                        {documentFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                          >
                            <div className="flex items-center space-x-3">
                              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDocument(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Registration Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Application Summary</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span> {formData.email}
                    </p>
                    <p>
                      <span className="font-medium">Nationality:</span> {formData.nationality}
                    </p>
                    <p>
                      <span className="font-medium">Previous School:</span> {formData.previousSchool || "Not specified"}
                    </p>
                    <p>
                      <span className="font-medium">Documents:</span> {documentFiles.length} file(s) uploaded
                    </p>
                    <p>
                      <span className="font-medium">Profile Photo:</span>{" "}
                      {profilePhotoPreview ? "Uploaded" : "Not uploaded"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-2 rounded-lg font-medium ${
                  currentStep === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:text-gray-900"
                }`}
              >
                ← Previous
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue →
                </button>
              ) : (
                <> </>
              )}
            </div>
            {currentStep === totalSteps && (
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Submitting..." : "Submit Registration"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
export const metadata = {
  title: "Student Registration",
  description: "Register as a student at our university",
}
