"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { verifyAuthSession } from "@/app/sessions/authSession"
import prisma from "@/app/lib/prisma"
import { redirect } from "next/navigation"

// Validation schemas
const ProfileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").max(20, "Phone number too long"),
  role: z.enum(["admin", "superadmin", "admission_officer", "finance_officer", "transcript_officer", "course_validator", "registrar_officer", "department_admin"]),
  nationality: z.string().optional(),
  address: z.string().optional(),
})

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain uppercase, lowercase, number, and special character"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const AvatarUploadSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number().max(1024 * 1024, "File size must be less than 1MB"),
  fileUrl: z.string(), // Base64 encoded file data
})

// Helper function to get current admin ID from session/cookies
// You'll need to implement this based on your auth system
async function getCurrentAdminId(): Promise<string | null> {
  // This is a placeholder - implement based on your authentication system
  // For example, if you store admin ID in cookies:
  const session = await verifyAuthSession()
  if(session){
    const user = await prisma.admin.findUnique({
        where:{email:session.email}
    })
    if(user){
        return user.id
    }
     redirect('/auth/login')
    return null
  }
  redirect('/auth/login')
  return null
}

export async function getCurrentAdminProfile() {
  try {
    const adminId = await getCurrentAdminId()
    if (!adminId) {
      return { success: false, error: "Not authenticated" }
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      include: {
        files: {
          where: { use: "profile_picture" },
          include: { file: true },
          take: 1,
        },
      },
    })

    if (!admin) {
      return { success: false, error: "Admin not found" }
    }

    // Transform data to match frontend interface
    const profileData = {
      _id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      phone: admin.phoneNumber,
      role: getRoleDisplayName(admin.role),
      department: getDepartmentFromRole(admin.role),
      avatar: admin.files[0]?.file?.fileUrl || null,
      joinDate: admin.createdAt.toISOString().split('T')[0],
      lastLogin: admin.updatedAt.toISOString(),
      nationality: admin.nationality,
      address: admin.address,
    }

    return {
      success: true,
      data: profileData,
    }
  } catch (error) {
    console.error("Error fetching admin profile:", error)
    return { success: false, error: "Failed to fetch profile" }
  }
}

export async function updateAdminProfile(data: z.infer<typeof ProfileUpdateSchema>) {
  try {
    const adminId = await getCurrentAdminId()
    if (!adminId) {
      return { success: false, error: "Not authenticated" }
    }

    const validatedData = ProfileUpdateSchema.parse(data)

    // Check if email is already taken by another admin
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        email: validatedData.email,
        NOT: { id: adminId },
      },
    })

    if (existingAdmin) {
      return { success: false, error: "Email address is already in use" }
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        role: validatedData.role,
        nationality: validatedData.nationality || "",
        address: validatedData.address || "",
        updatedAt: new Date(),
      },
    })

    revalidatePath("/admin/settings")
    return {
      success: true,
      data: {
        message: "Profile updated successfully",
        admin: {
          _id: updatedAdmin.id,
          firstName: updatedAdmin.firstName,
          lastName: updatedAdmin.lastName,
          email: updatedAdmin.email,
          phone: updatedAdmin.phoneNumber,
          role: getRoleDisplayName(updatedAdmin.role),
          department: getDepartmentFromRole(updatedAdmin.role),
        },
      },
    }
  } catch (error) {
    console.error("Error updating admin profile:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", details: error.errors }
    }
    return { success: false, error: "Failed to update profile" }
  }
}

export async function changeAdminPassword(data: z.infer<typeof PasswordChangeSchema>) {
  try {
    const adminId = await getCurrentAdminId()
    if (!adminId) {
      return { success: false, error: "Not authenticated" }
    }

    const validatedData = PasswordChangeSchema.parse(data)

    // Get current admin with password
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, password: true },
    })

    if (!admin) {
      return { success: false, error: "Admin not found" }
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(validatedData.currentPassword, admin.password)
    if (!isCurrentPasswordValid) {
      return { success: false, error: "Current password is incorrect" }
    }

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, saltRounds)

    // Update password
    await prisma.admin.update({
      where: { id: adminId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    })

    revalidatePath("/admin/settings")
    return {
      success: true,
      data: { message: "Password changed successfully" },
    }
  } catch (error) {
    console.error("Error changing password:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", details: error.errors }
    }
    return { success: false, error: "Failed to change password" }
  }
}

export async function uploadAdminAvatar(data: z.infer<typeof AvatarUploadSchema>) {
  try {
    const adminId = await getCurrentAdminId()
    if (!adminId) {
      return { success: false, error: "Not authenticated" }
    }

    const validatedData = AvatarUploadSchema.parse(data)

    
    // Here you would typically upload to a cloud storage service like AWS S3, Cloudinary, etc.
    // For this example, I'll simulate the upload and create a file record

    // Create file record
    const file = await prisma.file.create({
      data: {
        fileName: validatedData.fileName,
        originalName: validatedData.fileName,
        extension: validatedData.fileName.split('.').pop() || '',
        fileUrl: data.fileUrl,
        type: validatedData.fileType,
        size: validatedData.fileSize,
        fileType: "image",
      },
    })

    // Remove existing profile picture
    await prisma.userFile.deleteMany({
      where: {
        adminId: adminId,
        use: "profile_picture",
      },
    })

    // Create new profile picture association
    await prisma.userFile.create({
      data: {
        adminId: adminId,
        fileId: file.id,
        use: "profile_picture",
        verify: true,
      },
    })

    revalidatePath("/admin/settings")
    return {
      success: true,
      data: {
        message: "Avatar updated successfully",
        avatarUrl: data.fileUrl,
      },
    }
  } catch (error) {
    console.error("Error uploading avatar:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", details: error.errors }
    }
    return { success: false, error: "Failed to upload avatar" }
  }
}

export async function getAdminRoleOptions() {
  try {
    const roles = [
      { value: "admin", label: "Administrator" },
      { value: "superadmin", label: "Super Administrator" },
      { value: "admission_officer", label: "Admission Officer" },
      { value: "finance_officer", label: "Finance Officer" },
      { value: "transcript_officer", label: "Transcript Officer" },
      { value: "course_validator", label: "Course Validator" },
      { value: "registrar_officer", label: "Registrar Officer" },
      { value: "department_admin", label: "Department Admin" },
    ]

    return { success: true, data: roles }
  } catch (error) {
    console.error("Error fetching role options:", error)
    return { success: false, error: "Failed to fetch role options" }
  }
}

export async function getDepartmentOptions() {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    })

    const departmentOptions = [
      { value: "IT Department", label: "IT Department" },
      { value: "Academic Affairs", label: "Academic Affairs" },
      { value: "Student Services", label: "Student Services" },
      { value: "Finance", label: "Finance" },
      { value: "Human Resources", label: "Human Resources" },
      ...departments.map((dept:any) => ({
        value: dept.name,
        label: dept.name,
      })),
    ]

    return { success: true, data: departmentOptions }
  } catch (error) {
    console.error("Error fetching department options:", error)
    return { success: false, error: "Failed to fetch department options" }
  }
}

export async function deleteAdminAccount() {
  try {
    const adminId = await getCurrentAdminId()
    if (!adminId) {
      return { success: false, error: "Not authenticated" }
    }

    // Check if this is the last super admin
    const superAdminCount = await prisma.admin.count({
      where: { role: "superadmin", status: "active" },
    })

    const currentAdmin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { role: true },
    })

    if (currentAdmin?.role === "superadmin" && superAdminCount <= 1) {
      return { success: false, error: "Cannot delete the last super administrator" }
    }

    // Soft delete by updating status
    await prisma.admin.update({
      where: { id: adminId },
      data: {
        status: "inactive",
        updatedAt: new Date(),
      },
    })

    return {
      success: true,
      data: { message: "Account deactivated successfully" },
    }
  } catch (error) {
    console.error("Error deleting admin account:", error)
    return { success: false, error: "Failed to delete account" }
  }
}

export async function getAdminActivityLog() {
  try {
    const adminId = await getCurrentAdminId()
    if (!adminId) {
      return { success: false, error: "Not authenticated" }
    }

    // This would typically come from an audit log table
    // For now, we'll return mock data based on admin updates
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!admin) {
      return { success: false, error: "Admin not found" }
    }

    const activityLog = [
      {
        id: "1",
        action: "Profile Updated",
        timestamp: admin.updatedAt.toISOString(),
        details: "Updated profile information",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
      },
      {
        id: "2",
        action: "Login",
        timestamp: new Date(admin.updatedAt.getTime() - 86400000).toISOString(), // 1 day ago
        details: "Successful login",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
      },
      {
        id: "3",
        action: "Account Created",
        timestamp: admin.createdAt.toISOString(),
        details: "Admin account created",
        ipAddress: "192.168.1.1",
        userAgent: "System",
      },
    ]

    return { success: true, data: activityLog }
  } catch (error) {
    console.error("Error fetching activity log:", error)
    return { success: false, error: "Failed to fetch activity log" }
  }
}

// Helper functions
function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    admin: "Administrator",
    superadmin: "Super Administrator",
    admission_officer: "Admission Officer",
    finance_officer: "Finance Officer",
    transcript_officer: "Transcript Officer",
    course_validator: "Course Validator",
    registrar_officer: "Registrar Officer",
    department_admin: "Department Admin",
  }
  return roleMap[role] || role
}

function getDepartmentFromRole(role: string): string {
  const departmentMap: Record<string, string> = {
    admin: "IT Department",
    superadmin: "IT Department",
    admission_officer: "Academic Affairs",
    finance_officer: "Finance",
    transcript_officer: "Academic Affairs",
    course_validator: "Academic Affairs",
    registrar_officer: "Student Services",
    department_admin: "Academic Affairs",
  }
  return departmentMap[role] || "General"
}
