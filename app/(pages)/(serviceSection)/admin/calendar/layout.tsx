import React from 'react'
import ChatSideBar from '../../component/ChatSideBar'
import { ActionResult } from '@/app/actions/base-actions'
import { AIMessage, AISession } from '@/app/generated/prisma'
import { loadAllSessions } from '@/app/actions/chats.action'
type Props = {
    children: React.ReactNode
}
const layout = async ({children}:Props) => {
    const result:ActionResult<(AISession & {messages:AIMessage[]})[]> = await loadAllSessions('DEPARTMENT')
  return (
    <div className =' flex' >
        <main className='w-full flex-1 h-full overflow-y-auto '>
            {children}
        </main>
      <div className="basis-1/5 right-0 bg-white shadow-lg absolute">
        <ChatSideBar conversations={result.data || []} aiType='DEPARTMENT'/>
        </div> 
    </div>
  )
}

export default layout
