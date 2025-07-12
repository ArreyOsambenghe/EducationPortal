import { verifyServiceSectionAccess } from '@/app/actions/authActions'
import { verifyAuthSession } from '@/app/sessions/authSession'
import { redirect } from 'next/navigation'
import React, { ReactNode } from 'react'

type Props = {
    children:ReactNode
}

const layout = async (props: Props) => {
    
    const userCompleted = await verifyServiceSectionAccess()
    if(userCompleted.status == 'unactive'){
        redirect('/auth/login')
    }
    if(userCompleted.status == 'pending'){
        redirect(`/auth/${userCompleted.role}/register`)
    }
    

  return (
    <div>{props.children}</div>
  )
}

export default layout