import React, { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import AiChatSidebar from '../component/ai-charts-sidebar'
import Navbar from '../component/Navbar'

type Props = {
    children:ReactNode
}

const layout = async (props: Props) => {

  return (
    <div className='flex  h-screen overflow-hidden'>
        <Sidebar currentRole={"admin"}/>
        <main className="flex-1 h-full overflow-y-auto w-full">
        <Navbar/>
        {props.children}
        </main>
         
    </div>
  )
}

export default layout