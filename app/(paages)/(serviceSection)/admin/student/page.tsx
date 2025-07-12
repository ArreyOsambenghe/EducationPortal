import { getStudents } from '@/app/actions/admin/student.action'
import React from 'react'
import StudentAdmissionManagement from './StudentManagement'
import { verifyAuthSession } from '@/app/sessions/authSession'
import { redirect } from 'next/navigation'

type Props = {

}
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

const page = async (props: Props) => {
  const session = await verifyAuthSession()
  if(!session){
    redirect('auth/login')
  }
  const res = await getStudents();
  if (!res.success) {
    return <div>Error fetching students: {res.error}</div>
  }
  const students = res.data?.map((student) => {
    return {
      ...student,
      createdAt: typeof student.createdAt === 'string' ? student.createdAt : student.createdAt.toISOString(),
      updatedAt: typeof student.updatedAt === 'string' ? student.updatedAt : student.updatedAt.toISOString(),
      admisionRequestDocument: student.admisionRequestDocument.map((doc) => ({
        ...doc,
        verified: doc.verify || false, // Ensure verified is always a boolean
        fileUrl:doc.file.fileUrl,
        fileName: doc.file.fileName,
        fileType: doc.file.fileType,
        createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt.toISOString(),
        updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : doc.updatedAt.toISOString(),
        uploadedAt: doc.updatedAt
          ? (typeof doc.updatedAt === 'string' ? doc.updatedAt : doc.updatedAt.toISOString())
          : (typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt.toISOString()),
      })),
    } as Student;
  }) || [];
  return (
    <StudentAdmissionManagement initialStudents={students} adminEmail={session.email}  />
  )
}

export default page