import React from 'react'
import AdminSignup from './_component/AdminForm'
import SignupForm from './_component/RegistrationForm'
import { LoginForm } from './_component/LoginForm'
import TeacherSignup from './_component/TeacherForm'
import StudentSignup from './_component/StudentForm'
import { Metadata } from 'next'
import { verifyAuthSession } from '@/app/sessions/authSession'
import { redirect } from 'next/navigation'

type Props = {
    params:Promise<{authId:string[]}>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
 const { authId } = await params
  if(authId.length == 1 && authId[0] == "signup"){
      return {
        title: "Signup",
        description: "Create a new account",
      }
    }
    if(authId.length == 1 && authId[0] == "login"){
      return {
        title: "Login",
        description: "Login to your account",
      }
    }
    if(authId[1] == 'register'){
      switch (authId[0]) {
        case 'admin':
          return {
            title: "Admin registration",
            description: "Admin complete the registration form to create an account",
          }
          break;
        case 'teacher':
          return {
            title: "Teacher registration",
            description: "Teacher complete the registration form to create an account",
          }
        case 'student':
          return {
            title: "Student registration",
            description: "Student complete the registration form to create an account",
          }
        default:
          return  {
            title: "Registration",
            description: "Complete the registration form to create an account",
          };
      }
    }
 

  return {
    title: "Authentication",
    description: "Login or Signup to your account",
}
}

const page = async ({params}: Props) => {
    const {authId} = await params
    const session = await verifyAuthSession()
    console.log(session)
    if(authId.length == 1 && authId[0] == "signup"){
      return <SignupForm/>
    }
    if(authId.length == 1 && authId[0] == "login"){
      return <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
              <LoginForm/>
            </div>
    }
    if(authId[1] == 'register'){
      
      switch (authId[0]) {
        case 'admin':
          if(session && session.role == 'superadmin'){
            return <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
              <AdminSignup email={session.email}/>
            </div>
          }
          return redirect('/auth/login')
          break;
        case 'teacher':
          if(session && session.role == 'teacher'){
            return <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
              <TeacherSignup email={session.email}/>
            </div>
          }
          return redirect('/auth/login')
        case 'student':
          if(session && session.role == 'student'){
            return <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
              <StudentSignup email={session.email}/>
            </div>
          }
          return redirect('/auth/login')
        default:
          return  <></>;
      }
    }
  
}

export default page
