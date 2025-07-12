import { loadAllSessions } from '@/app/actions/chats.action'
import React from 'react'
import ChatSideBar from './ChatSideBar'
import { AIMessage, AISession } from '@/app/generated/prisma'
import { ActionResult } from '@/app/actions/base-actions'

const page = async () => {
  const result:ActionResult<(AISession & {messages:AIMessage[]})[]> = await loadAllSessions('ACADEMIC')
  return (
    <ChatSideBar conversations={result.data || []}/>
  )
}

export default page