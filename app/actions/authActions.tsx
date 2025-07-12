'use server'
import { connect } from "http2"
import { Admin } from "../generated/prisma"
import { UserRole } from "../interface"
import prisma from "../lib/prisma"
import { AuthService } from "../services/authService"
import { UploadService } from "../services/UploadService"
import { createAuthSession, verifyAuthSession } from "../sessions/authSession"
import { routeModule } from "next/dist/build/templates/app-page"



export async function signUpUser(formData: { firstName: string, lastName: string, email: string, password: string, role: UserRole }) {
    if (formData.role == 'superadmin') {
        const response = await AuthService.createAdmin({ firstName: formData.firstName, lastName: formData.lastName, email: formData.email, password: formData.password, phoneNumber: '', dof: '', sex: '', nationality: '', address: '' })
        if (response.success && response.admin) {

            return { success: true, message: "Admin created successfully" }
        }
        else {
            console.log(response.error)
            return { success: false, message: response.message }
        }
    }
    if (formData.role == 'student') {
        const response = await AuthService.createStudent({ firstName: formData.firstName, lastName: formData.lastName, email: formData.email, password: formData.password, phoneNumber: '', dof: '', sex: '', nationality: '', address: '', previousSchool: '', previousSchoolAddress: '', moreAboutYourself: '', GCEAdvancedLevelResult: '' })
        if (response.success && response.student) {

            return { success: true, message: "Student created successfully" }
        }
        else {
            console.log(response.error)
            return { success: false, message: response.message }
        }
    }
    if (formData.role == 'teacher') {
        const response = await AuthService.createTeacher({ firstName: formData.firstName, lastName: formData.lastName, email: formData.email, password: formData.password, phoneNumber: '', dof: '', sex: '', nationality: '', address: '' })
        if (response.success && response.teacher) {

            return { success: true, message: "Teacher created successfully" }
        }
        else {
            console.log(response.error)
            return { success: false, message: response.message }
        }
    }
    return { success: false, message: "Invalid role" }
}


export async function loginUser(formData: { email: string, password: string, role: UserRole }) {
    console.log(formData.role)
    const response = await AuthService.loginUser(formData.email, formData.password, formData.role as 'student' | 'teacher' | 'superadmin')
    if (response.success && response.user) {
       await createAuthSession({ email: response.user.email, role: formData.role })
        return { success: true, message: "Login successful", registrationProcess: response.user.registratioProcess, userRole: formData.role, userId: response.user.id }
    }
    else {
        console.log(response.error)
        return { success: false, message: response.message }
    }
}


export async function adminRegistration(formData: {
    firstName: string;
    lastName: string;
    email: string;
    dof: string;
    sex: string;
    nationality: string;
    address: string;
    phoneNumber: string;
    status: string;
    profilePhoto: File | null;
    cv: File | null;
}, id: string) {

    const [profilePhotoMTD, cvMTD] = await Promise.all([
        formData.profilePhoto ? UploadService.uploadFile(formData.profilePhoto) : null,
        formData.cv ? UploadService.uploadFile(formData.cv) : null,
    ]);
    const [profilePhoto, cv] = await Promise.all([
  (async () => {
    if (!profilePhotoMTD?.success || !profilePhotoMTD.metadata) {
      return null;
    }
    return await prisma.userFile.create({
      data: {
        adminId: id,
        fileId: profilePhotoMTD.metadata.id,
        use: 'profile_picture'
      }
    });
  })(),

  (async () => {
    if (!cvMTD?.metadata || !cvMTD.success) {
      return null;
    }
    return await prisma.userFile.create({
      data: {
        adminId: id,
        fileId: cvMTD.metadata.id,
        use: 'cv'
      }
    });
  })(),
]);


    const updatedAdmin: Partial<Admin> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        dof: formData.dof,
        sex: formData.sex,
        nationality: formData.nationality,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        status: formData.status,
        registratioProcess: 'completed'
    }
    const response = await AuthService.updateAdmin(id, updatedAdmin)
    if (response.success && response.admin) {
        return { success: true, message: "Admin updated successfully" }
    }
    else {
        console.log(response.error)
        return { success: false, message: response.message }
    }



}


export async function teacherRegistration(id: string, formData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    dof: string;
    sex: string;
    nationality: string;
    address: string;
    cv: File[];
    profilePhoto: File | null
}) {

    const [profilePhotoMTD, cvMTD] = await Promise.all([
        formData.profilePhoto ? UploadService.uploadFile(formData.profilePhoto) : null,
        formData.cv.length === 0
            ? Promise.resolve(null)
            : Promise.all(formData.cv.map((file) => UploadService.uploadFile(file)))
    ]);

    const [profilePhoto, cv] = await Promise.all([
        (async () => {
            if (!profilePhotoMTD?.success || !profilePhotoMTD.metadata) {
                return null;
            }
            return await prisma.userFile.create({
                data: {
                    teacherId: id,
                    fileId: profilePhotoMTD.metadata.id,
                    use: 'profile_picture'
                }
            });
        })(),
        (async () => {
            const cvFiles = cvMTD;
            if (!cvFiles) return null;

            // Insert all CV files
            return await Promise.all(
                cvFiles.map((file) => {
                    if (!file?.metadata || !file.success) {
                        return null;
                    }
                    return prisma.userFile.create({
                        data: {
                            teacherId: id,
                            fileId: file.metadata.id,
                            use: 'cv',
                        },
                    });
                }),
            );
        })(),
    ]);

    const updatedTeacher = await AuthService.updateTeacher(id, { firstName: formData.firstName, lastName: formData.lastName, phoneNumber: formData.phoneNumber, email: formData.email, dof: formData.dof, sex: formData.sex, nationality: formData.nationality, address: formData.address, registratioProcess: 'completed' })
    if (updatedTeacher.success && updatedTeacher.teacher) {
        return { success: true, message: "Teacher updated successfully" }
    }
    else {
        console.log(updatedTeacher.error)
        return { success: false, message: updatedTeacher.message }
    }


}
export async function studentRegistration(id: string, formData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    dof: string;
    sex: string;
    nationality: string;
    address: string;
    programId: string;
    previousSchool: string;
    previousSchoolAddress: string;
    moreAboutYourself: string;
    GCEAdvancedLevelResult: string;
    profilePhoto: File | null;
    admisionRequestDocument: File[];
}) {

    const [profilePhotoMTD, admisionRequestDocumentMTD] = await Promise.all([
        formData.profilePhoto ? UploadService.uploadFile(formData.profilePhoto) : null,
        formData.admisionRequestDocument.length === 0
            ? Promise.resolve(null)
            : Promise.all(formData.admisionRequestDocument.map((file) => UploadService.uploadFile(file)))
    ]);

    const [profilePhoto, admisionRequestDocument] = await Promise.all([
        (async () => {
            if (!profilePhotoMTD?.success || !profilePhotoMTD.metadata) {
                return null;
            }
            return await prisma.userFile.create({
                data: {
                    studentId: id,
                    fileId: profilePhotoMTD.metadata.id,
                    use: 'profile_picture'
                }
            });
        })(),
        (async () => {
            const admisionRequestDocuments = admisionRequestDocumentMTD;
            if (!admisionRequestDocuments) return null;

            // Insert all CV files
            return await Promise.all(
                admisionRequestDocuments.map((file) => {
                    if (!file?.metadata || !file.success) {
                        return null;
                    }
                    return prisma.userFile.create({
                        data: {
                            studentId: id,
                            fileId: file.metadata.id,
                            use: 'admission_document',
                        },
                    });
                }),
            );
        })(),
    ]
    );
    const updatedStudent = await AuthService.updateStudent(id, { firstName: formData.firstName, lastName: formData.lastName, phoneNumber: formData.phoneNumber, email: formData.email, dof: formData.dof, sex: formData.sex, nationality: formData.nationality, address: formData.address, previousSchool: formData.previousSchool, previousSchoolAddress: formData.previousSchoolAddress, moreAboutYourself: formData.moreAboutYourself, GCEAdvancedLevelResult: formData.GCEAdvancedLevelResult, registratioProcess: 'completed',programId: formData.programId })
    if (updatedStudent.success && updatedStudent.student) {
        return { success: true, message: "Student updated successfully" }
    }
    else {
        console.log(updatedStudent.error)
        return { success: false, message: updatedStudent.message }
    }

}

export const getAdminByEmail = async (email: string) => {
    const admin = await prisma.admin.findUnique({
        where: {
            email: email
        }
    })
    return admin
}

export const getTeacherByEmail = async (email: string) => {
    const teacher = await prisma.teacher.findUnique({
        where: {
            email: email
        }
    })
    return teacher
}

export const getStudentByEmail = async (email: string) => {
    const student = await prisma.student.findUnique({
        where: {
            email: email
        }
    })
    return student
}

export const verifyServiceSectionAccess = async () => {
    const session = await verifyAuthSession()
    if (!session) {
        return { status: 'unactive', user:null}
    }
    if(session.role == 'superadmin'){
        const user = await getAdminByEmail(session.email)
        if (!user) {
            return { status: 'unactive', user:null}
        }
        return { status: user.registratioProcess, user:user,role:'superadmin'}
    }
    if(session.role == 'teacher'){
        const user = await getTeacherByEmail(session.email)
        if (!user) {
            return { status: 'unactive', user:null}
        }
        return { status: user.registratioProcess, user:user,role:'teacher'}
    }
    if(session.role == 'student'){
        const user = await getStudentByEmail(session.email)
        if (!user) {
            return { status: 'unactive', user:null}
        }
        return { status: user.registratioProcess, user:user,role:'student'}
    }

    return { status: false, user:null}
}
