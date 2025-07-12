import prisma from '@/app/lib/prisma'
import { verifyAuthSession } from '@/app/sessions/authSession'
import { redirect } from 'next/navigation'
import React from 'react'
import StudentCourseManagement from './studentCourseManagement'

const page = async () => {
    const session = await verifyAuthSession()
    if(!session){
        redirect('/auth/login')
    }
    const student = await prisma.student.findUnique({
        where:{email:session.email},
        select:{
            id:true,
        }
    })
    if(!student){
        redirect('/auth/login')
    }
  return (
    <StudentCourseManagement studentId={student.id}/>
  )
}

export default page