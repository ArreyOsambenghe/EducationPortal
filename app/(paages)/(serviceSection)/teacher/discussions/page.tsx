import prisma from '@/app/lib/prisma'
import { verifyAuthSession } from '@/app/sessions/authSession'
import { redirect } from 'next/navigation'
import React from 'react'
import CourseDiscussions from '../../component/Discussion'

const page = async () => {
  const session = await verifyAuthSession()
  if(!session){
    redirect('/auth/login')
  }
  const user = await prisma.teacher.findUnique({
    where:{email:session.email},
    select:{
      firstName:true,
      lastName:true,
      email:true,
      id:true
    }
  })
  if(!user){
    redirect('/auth/login')
  }
  const User = {
    id:user.id,
    name:`${user.firstName} ${user.lastName}`,
    email:user.email,
    role:'teacher'
  }
  return (
    <CourseDiscussions user={User}/>
  )
}

export default page
