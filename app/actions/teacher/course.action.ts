
"use server"

import { revalidatePath } from "next/cache"
import  prisma  from "@/app/lib/prisma" // Adjust path as needed
import { verifyAuthSession } from "@/app/sessions/authSession"
import { redirect } from "next/navigation"

// Types for the frontend (matching your original types)
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
  files?: string[]
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

// Helper functions to transform database data to frontend types
function transformSemesterCourseToFrontend(semesterCourse: any): Course {
  return {
    id: semesterCourse.id,
    name: semesterCourse.course.name,
    code: semesterCourse.course.code,
    semester: semesterCourse.semester,
    credits: semesterCourse.course.credits,
    schedule: semesterCourse.schedule,
    room: semesterCourse.room,
    enrolledStudents: semesterCourse.enrolledStudents,
    status: semesterCourse.status.toLowerCase() as "active" | "completed" | "upcoming",
    description: semesterCourse.description || "",
    syllabus: [], // Legacy field, can be computed from syllabusItems if needed
    syllabusItems: semesterCourse.syllabusItems?.map((item: any) => ({
      id: item.id,
      week: item.week,
      title: item.title,
      description: item.description || "",
      topics: item.topics || [],
      readings: item.readings || [],
      assignments: item.assignments || [],
      notes: item.notes || "",
    })) || [],
    assignments: semesterCourse.assignments?.map((assignment: any) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate.toISOString().split("T")[0],
      totalPoints: assignment.totalPoints,
      submissions: assignment.submissions,
      files: assignment.files || [],
      status: assignment.status.toLowerCase() as "active" | "closed" | "draft",
    })) || [],
    announcements: semesterCourse.announcements?.map((announcement: any) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      date: announcement.createdAt.toISOString().split("T")[0],
      priority: announcement.priority.toLowerCase() as "low" | "medium" | "high",
    })) || [],
    materials: semesterCourse.materials?.map((material: any) => ({
      id: material.id,
      title: material.title,
      description: material.description || "",
      type: material.type.toLowerCase() as "file" | "link" | "video" | "document",
      category: material.category,
      url: material.url || "",
      fileName: material.fileName,
      fileSize: material.fileSize,
      uploadDate: material.createdAt.toISOString().split("T")[0],
      isVisible: material.isVisible,
      downloadCount: material.downloadCount,
    })) || [],
    uploads: semesterCourse.uploads?.map((upload: any) => ({
      id: upload.id,
      name: upload.name,
      fileName: upload.fileName,
      fileSize: upload.fileSize,
      uploadDate: upload.createdAt.toISOString().split("T")[0],
      fileType: upload.fileType,
      fileUrl: upload.fileUrl,
    })) || [],
  }
}

// Get all courses (semester courses)
export async function getCourses() {
  try {
    const instruction  = await verifyAuthSession()
    if(!instruction){
        redirect('auth/login')
    }

    const semesterCourses = await prisma.semesterCourse.findMany({
        where:{
            instructor:{
                email:instruction.email
            }
        },
      include: {
        course: true,
        instructor: true,
        syllabusItems: {
          orderBy: { week: 'asc' }
        },
        assignments: {
          orderBy: { createdAt: 'desc' }
        },
        announcements: {
          orderBy: { createdAt: 'desc' }
        },
        materials: {
          orderBy: { createdAt: 'desc' }
        },
        uploads: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    const courses = semesterCourses.map(transformSemesterCourseToFrontend)
    return { success: true, data: courses }
  } catch (error) {
    console.error('Error fetching courses:', error)
    return { success: false, error: "Failed to fetch courses" }
  }
}

// Get single course
export async function getCourse(courseId: string) {
  try {
    const semesterCourse = await prisma.semesterCourse.findUnique({
      where: { id: courseId },
      include: {
        course: true,
        instructor: true,
        syllabusItems: {
          orderBy: { week: 'asc' }
        },
        assignments: {
          orderBy: { createdAt: 'desc' }
        },
        announcements: {
          orderBy: { createdAt: 'desc' }
        },
        materials: {
          orderBy: { createdAt: 'desc' }
        },
        uploads: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!semesterCourse) {
      return { success: false, error: "Course not found" }
    }

    const course = transformSemesterCourseToFrontend(semesterCourse)
    return { success: true, data: course }
  } catch (error) {
    console.error('Error fetching course:', error)
    return { success: false, error: "Failed to fetch course" }
  }
}

// ASSIGNMENT ACTIONS
export async function createAssignment(courseId: string, assignmentData: Omit<Assignment, "id" | "submissions">) {
  try {
    const newAssignment = await prisma.courseAssignment.create({
      data: {
        semesterCourseId: courseId,
        title: assignmentData.title,
        description: assignmentData.description,
        dueDate: new Date(assignmentData.dueDate),
        totalPoints: assignmentData.totalPoints,
        files: assignmentData.files || [],
        status: assignmentData.status.toUpperCase() as "ACTIVE" | "CLOSED" | "DRAFT",
      },
      include:{
        submissions:true,
      }
    })

    revalidatePath("/courses")
    return { success: true, data: {
      id: newAssignment.id,
      title: newAssignment.title,
      description: newAssignment.description,
      dueDate: newAssignment.dueDate.toISOString().split("T")[0],
      totalPoints: newAssignment.totalPoints,
      submissions: newAssignment.submissions.length,
      files: newAssignment.files,
      status: newAssignment.status.toLowerCase() as "active" | "closed" | "draft",
    } }
  } catch (error) {
    console.error('Error creating assignment:', error)
    return { success: false, error: "Failed to create assignment" }
  }
}

export async function updateAssignment(
  courseId: string,
  assignmentId: string,
  assignmentData: Omit<Assignment, "id" | "submissions">,
) {
  try {
    const updatedAssignment = await prisma.courseAssignment.update({
      where: { id: assignmentId },
      data: {
        title: assignmentData.title,
        description: assignmentData.description,
        dueDate: new Date(assignmentData.dueDate),
        totalPoints: assignmentData.totalPoints,
        files: assignmentData.files || [],
        status: assignmentData.status.toUpperCase() as "ACTIVE" | "CLOSED" | "DRAFT",
      },
      include:{
        submissions:true,
      }
    })

    revalidatePath("/courses")
    return { success: true, data: {
      id: updatedAssignment.id,
      title: updatedAssignment.title,
      description: updatedAssignment.description,
      dueDate: updatedAssignment.dueDate.toISOString().split("T")[0],
      totalPoints: updatedAssignment.totalPoints,
      submissions: updatedAssignment.submissions.length,
      files: updatedAssignment.files,
      status: updatedAssignment.status.toLowerCase() as "active" | "closed" | "draft",
    } }
  } catch (error) {
    console.error('Error updating assignment:', error)
    return { success: false, error: "Failed to update assignment" }
  }
}

export async function deleteAssignment(courseId: string, assignmentId: string) {
  try {
    await prisma.courseAssignment.delete({
      where: { id: assignmentId }
    })

    revalidatePath("/courses")
    return { success: true }
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return { success: false, error: "Failed to delete assignment" }
  }
}

// ANNOUNCEMENT ACTIONS
export async function createAnnouncement(courseId: string, announcementData: Omit<Announcement, "id" | "date">) {
  try {
    const newAnnouncement = await prisma.courseAnnouncement.create({
      data: {
        semesterCourseId: courseId,
        title: announcementData.title,
        content: announcementData.content,
        priority: announcementData.priority.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
      }
    })

    revalidatePath("/courses")
    return { success: true, data: {
      id: newAnnouncement.id,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      date: newAnnouncement.createdAt.toISOString().split("T")[0],
      priority: newAnnouncement.priority.toLowerCase() as "low" | "medium" | "high",
    } }
  } catch (error) {
    console.error('Error creating announcement:', error)
    return { success: false, error: "Failed to create announcement" }
  }
}

export async function updateAnnouncement(
  courseId: string,
  announcementId: string,
  announcementData: Omit<Announcement, "id" | "date">,
) {
  try {
    const updatedAnnouncement = await prisma.courseAnnouncement.update({
      where: { id: announcementId },
      data: {
        title: announcementData.title,
        content: announcementData.content,
        priority: announcementData.priority.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
      }
    })

    revalidatePath("/courses")
    return { success: true, data: {
      id: updatedAnnouncement.id,
      title: updatedAnnouncement.title,
      content: updatedAnnouncement.content,
      date: updatedAnnouncement.createdAt.toISOString().split("T")[0],
      priority: updatedAnnouncement.priority.toLowerCase() as "low" | "medium" | "high",
    } }
  } catch (error) {
    console.error('Error updating announcement:', error)
    return { success: false, error: "Failed to update announcement" }
  }
}

export async function deleteAnnouncement(courseId: string, announcementId: string) {
  try {
    await prisma.courseAnnouncement.delete({
      where: { id: announcementId }
    })

    revalidatePath("/courses")
    return { success: true }
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return { success: false, error: "Failed to delete announcement" }
  }
}

// MATERIAL ACTIONS
export async function createMaterial(
  courseId: string,
  materialData: Omit<Material, "id" | "uploadDate" | "downloadCount">,
) {
  try {
    const newMaterial = await prisma.courseMaterial.create({
      data: {
        semesterCourseId: courseId,
        title: materialData.title,
        description: materialData.description,
        type: materialData.type.toUpperCase() as "FILE" | "LINK" | "VIDEO" | "DOCUMENT",
        category: materialData.category,
        url: materialData.url,
        fileName: materialData.fileName,
        fileSize: materialData.fileSize,
        isVisible: materialData.isVisible,
      }
    })

    revalidatePath("/courses")
    return { success: true, data: {
      id: newMaterial.id,
      title: newMaterial.title,
      description: newMaterial.description || "",
      type: newMaterial.type.toLowerCase() as "file" | "link" | "video" | "document",
      category: newMaterial.category,
      url: newMaterial.url || "",
      fileName: newMaterial.fileName,
      fileSize: newMaterial.fileSize,
      uploadDate: newMaterial.createdAt.toISOString().split("T")[0],
      isVisible: newMaterial.isVisible,
      downloadCount: newMaterial.downloadCount,
    } }
  } catch (error) {
    console.error('Error creating material:', error)
    return { success: false, error: "Failed to create material" }
  }
}

export async function updateMaterial(
  courseId: string,
  materialId: string,
  materialData: Omit<Material, "id" | "uploadDate" | "downloadCount">,
) {
  try {
    const updatedMaterial = await prisma.courseMaterial.update({
      where: { id: materialId },
      data: {
        title: materialData.title,
        description: materialData.description,
        type: materialData.type.toUpperCase() as "FILE" | "LINK" | "VIDEO" | "DOCUMENT",
        category: materialData.category,
        url: materialData.url,
        fileName: materialData.fileName,
        fileSize: materialData.fileSize,
        isVisible: materialData.isVisible,
      }
    })

    revalidatePath("/courses")
    return { success: true, data: {
      id: updatedMaterial.id,
      title: updatedMaterial.title,
      description: updatedMaterial.description || "",
      type: updatedMaterial.type.toLowerCase() as "file" | "link" | "video" | "document",
      category: updatedMaterial.category,
      url: updatedMaterial.url || "",
      fileName: updatedMaterial.fileName,
      fileSize: updatedMaterial.fileSize,
      uploadDate: updatedMaterial.createdAt.toISOString().split("T")[0],
      isVisible: updatedMaterial.isVisible,
      downloadCount: updatedMaterial.downloadCount,
    } }
  } catch (error) {
    console.error('Error updating material:', error)
    return { success: false, error: "Failed to update material" }
  }
}

export async function deleteMaterial(courseId: string, materialId: string) {
  try {
    await prisma.courseMaterial.delete({
      where: { id: materialId }
    })

    revalidatePath("/courses")
    return { success: true }
  } catch (error) {
    console.error('Error deleting material:', error)
    return { success: false, error: "Failed to delete material" }
  }
}

export async function toggleMaterialVisibility(courseId: string, materialId: string) {
  try {
    const material = await prisma.courseMaterial.findUnique({
      where: { id: materialId }
    })

    if (!material) {
      return { success: false, error: "Material not found" }
    }

    const updatedMaterial = await prisma.courseMaterial.update({
      where: { id: materialId },
      data: { isVisible: !material.isVisible }
    })

    revalidatePath("/courses")
    return { success: true, data: {
      id: updatedMaterial.id,
      title: updatedMaterial.title,
      description: updatedMaterial.description || "",
      type: updatedMaterial.type.toLowerCase() as "file" | "link" | "video" | "document",
      category: updatedMaterial.category,
      url: updatedMaterial.url || "",
      fileName: updatedMaterial.fileName,
      fileSize: updatedMaterial.fileSize,
      uploadDate: updatedMaterial.createdAt.toISOString().split("T")[0],
      isVisible: updatedMaterial.isVisible,
      downloadCount: updatedMaterial.downloadCount,
    } }
  } catch (error) {
    console.error('Error toggling material visibility:', error)
    return { success: false, error: "Failed to toggle material visibility" }
  }
}

// SYLLABUS ACTIONS
export async function createSyllabusItem(courseId: string, syllabusData: Omit<SyllabusItem, "id">) {
  try {
    const newSyllabusItem = await prisma.courseSyllabus.create({
      data: {
        semesterCourseId: courseId,
        week: syllabusData.week,
        title: syllabusData.title,
        description: syllabusData.description,
        topics: syllabusData.topics,
        readings: syllabusData.readings,
        assignments: syllabusData.assignments,
        notes: syllabusData.notes,
      }
    })

      revalidatePath("/courses")
    return { success: true, data: {
      id: newSyllabusItem.id,
      week: newSyllabusItem.week,
      title: newSyllabusItem.title,
      description: newSyllabusItem.description || "",
      topics: newSyllabusItem.topics,
      readings: newSyllabusItem.readings,
      assignments: newSyllabusItem.assignments,
      notes: newSyllabusItem.notes || "",
    } }
  } catch (error) {
    console.error('Error creating syllabus item:', error)
    return { success: false, error: "Failed to create syllabus item" }
  }
}

export async function deleteSyllabusItem(courseId: string, syllabusId: string) {
  try {
    await prisma.courseSyllabus.delete({
      where: { id: syllabusId }
    })

    revalidatePath("/courses")
    return { success: true }
  } catch (error) {
    console.error('Error deleting syllabus item:', error)
    return { success: false, error: "Failed to delete syllabus item" }
  }
}

// UPLOAD ACTIONS
export async function createUpload(courseId: string, uploadData: Omit<Upload, "id" | "uploadDate">) {
  try {
    const newUpload = await prisma.courseUpload.create({
      data: {
        semesterCourseId: courseId,
        name: uploadData.name,
        fileName: uploadData.fileName,
        fileSize: uploadData.fileSize,
        fileType: uploadData.fileType,
        fileUrl: uploadData.fileUrl,
      }
    })

    revalidatePath("/courses")
    return { success: true, data: {
      id: newUpload.id,
      name: newUpload.name,
      fileName: newUpload.fileName,
      fileSize: newUpload.fileSize,
      uploadDate: newUpload.createdAt.toISOString().split("T")[0],
      fileType: newUpload.fileType,
      fileUrl: newUpload.fileUrl,
    } }
  } catch (error) {
    console.error('Error creating upload:', error)
    return { success: false, error: "Failed to create upload" }
  }
}

export async function deleteUpload(courseId: string, uploadId: string) {
  try {
    await prisma.courseUpload.delete({
      where: { id: uploadId }
    })

    revalidatePath("/courses")
    return { success: true }
  } catch (error) {
    console.error('Error deleting upload:', error)
    return { success: false, error: "Failed to delete upload" }
  }
}

// ADDITIONAL HELPER FUNCTIONS

// Create a new semester course
export async function createSemesterCourse(data: {
  courseId: string
  instructorId: string
  semester: string
  schedule: string
  room: string
  description?: string
}) {
  try {
    const newSemesterCourse = await prisma.semesterCourse.create({
      data: {
        courseId: data.courseId,
        instructorId: data.instructorId,
        semester: data.semester,
        schedule: data.schedule,
        room: data.room,
        description: data.description,
      },
      include: {
        course: true,
        instructor: true,
        syllabusItems: {
          orderBy: { week: 'asc' }
        },
        assignments: {
          orderBy: { createdAt: 'desc' }
        },
        announcements: {
          orderBy: { createdAt: 'desc' }
        },
        materials: {
          orderBy: { createdAt: 'desc' }
        },
        uploads: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    revalidatePath("/courses")
    return { success: true, data: transformSemesterCourseToFrontend(newSemesterCourse) }
  } catch (error) {
    console.error('Error creating semester course:', error)
    return { success: false, error: "Failed to create semester course" }
  }
}

// Update semester course details
export async function updateSemesterCourse(
  courseId: string,
  data: {
    semester?: string
    schedule?: string
    room?: string
    description?: string
    enrolledStudents?: number
    status?: "active" | "completed" | "upcoming"
  }
) {
  try {
    const updatedSemesterCourse = await prisma.semesterCourse.update({
      where: { id: courseId },
      data: {
        ...data,
        status: data.status ? data.status.toUpperCase() as "ACTIVE" | "COMPLETED" | "UPCOMING" : undefined,
      },
      include: {
        course: true,
        instructor: true,
        syllabusItems: {
          orderBy: { week: 'asc' }
        },
        assignments: {
          orderBy: { createdAt: 'desc' }
        },
        announcements: {
          orderBy: { createdAt: 'desc' }
        },
        materials: {
          orderBy: { createdAt: 'desc' }
        },
        uploads: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    revalidatePath("/courses")
    return { success: true, data: transformSemesterCourseToFrontend(updatedSemesterCourse) }
  } catch (error) {
    console.error('Error updating semester course:', error)
    return { success: false, error: "Failed to update semester course" }
  }
}

// Delete semester course
export async function deleteSemesterCourse(courseId: string) {
  try {
    await prisma.semesterCourse.delete({
      where: { id: courseId }
    })

    revalidatePath("/courses")
    return { success: true }
  } catch (error) {
    console.error('Error deleting semester course:', error)
    return { success: false, error: "Failed to delete semester course" }
  }
}

// Get courses by instructor
export async function getCoursesByInstructor(instructorId: string) {
  try {
    const semesterCourses = await prisma.semesterCourse.findMany({
      where: { instructorId },
      include: {
        course: true,
        instructor: true,
        syllabusItems: {
          orderBy: { week: 'asc' }
        },
        assignments: {
          orderBy: { createdAt: 'desc' }
        },
        announcements: {
          orderBy: { createdAt: 'desc' }
        },
        materials: {
          orderBy: { createdAt: 'desc' }
        },
        uploads: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    const courses = semesterCourses.map(transformSemesterCourseToFrontend)
    return { success: true, data: courses }
  } catch (error) {
    console.error('Error fetching courses by instructor:', error)
    return { success: false, error: "Failed to fetch courses" }
  }
}

// Get courses by semester
export async function getCoursesBySemester(semester: string) {
  try {
    const semesterCourses = await prisma.semesterCourse.findMany({
      where: { semester },
      include: {
        course: true,
        instructor: true,
        syllabusItems: {
          orderBy: { week: 'asc' }
        },
        assignments: {
          orderBy: { createdAt: 'desc' }
        },
        announcements: {
          orderBy: { createdAt: 'desc' }
        },
        materials: {
          orderBy: { createdAt: 'desc' }
        },
        uploads: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    const courses = semesterCourses.map(transformSemesterCourseToFrontend)
    return { success: true, data: courses }
  } catch (error) {
    console.error('Error fetching courses by semester:', error)
    return { success: false, error: "Failed to fetch courses" }
  }
}

// Increment material download count
export async function incrementMaterialDownloadCount(materialId: string) {
  try {
    const updatedMaterial = await prisma.courseMaterial.update({
      where: { id: materialId },
      data: {
        downloadCount: {
          increment: 1
        }
      }
    })

    return { success: true, data: updatedMaterial }
  } catch (error) {
    console.error('Error incrementing download count:', error)
    return { success: false, error: "Failed to increment download count" }
  }
}
export async function updateSyllabusItem(courseId: string, syllabusId: string, syllabusData: Omit<SyllabusItem, "id">) {
  try {
    const updatedSyllabusItem = await prisma.courseSyllabus.update({
      where: { id: syllabusId },
      data: {
        week: syllabusData.week,
        title: syllabusData.title,
        description: syllabusData.description,
         topics: syllabusData.topics,
        readings: syllabusData.readings,
        assignments: syllabusData.assignments,
        notes: syllabusData.notes,
      }
    })
  

revalidatePath("/courses")
    return { success: true, data: {
      id: updatedSyllabusItem.id,
      week: updatedSyllabusItem.week,
      title: updatedSyllabusItem.title,
      description: updatedSyllabusItem.description || "",
      topics: updatedSyllabusItem.topics,
      readings: updatedSyllabusItem.readings,
      assignments: updatedSyllabusItem.assignments,
      notes: updatedSyllabusItem.notes || "",
    } }
  } catch (error) {
    console.error('Error updating syllabus item:', error)
    return { success: false, error: "Failed to update syllabus item" }
  }
}