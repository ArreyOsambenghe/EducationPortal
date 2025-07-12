import React from 'react'
import TeacherAssignments from './Mangament'
import { verifyAuthSession } from '@/app/sessions/authSession'
import { redirect } from 'next/navigation'
import prisma from '@/app/lib/prisma'

const page = async () => {
  const session = await verifyAuthSession()
  if(!session){
    redirect('/auth/login')
  }
  const user = await prisma.teacher.findUnique({
    where:{email:session.email},
    select:{
      id:true,
    }
  })
  if(!user){
    redirect('/auth/login')
  }
  return (
    <TeacherAssignments teacherId={user.id}/>
  )
}

export default page
