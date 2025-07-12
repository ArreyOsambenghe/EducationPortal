"use client"
import { ArrowUp, Bot, History, LoaderCircle, MessageSquare, X } from 'lucide-react'
import React, { FormEvent, useEffect, useState } from 'react'
import { ChatMessages, FunctionCall } from './ChatComponent'
import { createSession, loadSession, verifySessionTitle } from '@/app/actions/chats.action'
import { toast } from 'sonner'
import { AIMessage, AISession, AITYPE } from '@/app/generated/prisma'
import Conversation from './Conversation'
import { AIMessagePromptTemplate } from '@langchain/core/prompts'
import { AcademicChatPrompt } from '@/app/api/agent/academic-structure/type'
import { set } from 'lodash'
import { useNavigationStore } from '@/app/store/NavigationStore'
import { useShallow } from 'zustand/shallow'

export interface ChatMessage {
  id: string
  type: "user" | "model" | "function" | "completed"
  content?: string
  timestamp: Date
  task?: FunctionCall[]
  sendStatus?: "loading" | "completed" | 'error'
}

type LogEntry = {
  role: string;
  message?: string;
  data?: any;
  args?: any;
  result?: any;
  response?: any;
  name?: string;
  error?: any;
};

type Props = {
  conversations:(AISession & {messages:AIMessage[]})[]
  aiType: AITYPE
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const ChatSideBar = ({conversations,aiType}:Props) => {
  const {open,setOpen} = useNavigationStore(useShallow(state => ({
    open:state.openChatSideBar,
    setOpen:state.setOpenChatSideBar
  })))
  const [activeTab, setActiveTab] = useState("history")
  const [loading,setLoading] = useState({
    newSession:false,
    conversation:false,
    newMessage:false,
  })
  const [chatMessages,setChatMessages] = useState<ChatMessage[]>([])
  const [apiMessages,setApiMessages] = useState<AcademicChatPrompt['messages']>([])
  const [prompt,setPrompt] = useState('')
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const urlLinks = {
    ACADEMIC:'/academic-structure',
    DEPARTMENT:'/department',
    SCHEDULE:'/schedule',
    STUDENTADMIT:'/studentAccept',
    REPORT:'/reports'
  }
  
  const handleSubmit = async (e:FormEvent) => {
    e.preventDefault()
    setLoading(prev => ({...prev,newMessage:true}))
    const newUserId = generateId()
    const newModelId = generateId()
    try {
      const createName = await verifySessionTitle(currentConversationId!)
      setChatMessages(prev => [...prev,{id:newUserId,type:'user',content:prompt,timestamp:new Date(),sendStatus:'loading'}])
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/agent${urlLinks[aiType as keyof typeof urlLinks]}`, {
        method: "POST",
        body: JSON.stringify({ prompt,messages:apiMessages,creatName:!createName,sessionId:currentConversationId } as AcademicChatPrompt),
      });
      setPrompt('')
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let firstIterationReceived = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('Stream finished');
          break
        };

        const lines = decoder.decode(value).split("\n").filter(Boolean);

        for (const line of lines) {
          const log: LogEntry = JSON.parse(line);
          if(log.role === 'user-message-recieve'){
            setChatMessages(prev => prev.map(msg => msg.id === newUserId ? {...msg,sendStatus:'completed'} : msg))
          }
          if (log.role === "log" && log.message?.includes("Loop iteration: 0") && !firstIterationReceived) {
              const messag:ChatMessage = {
                id:newModelId,
                type:'model',
                timestamp:new Date(),
                task:[
                  {
                    name:'thinking',
                    status:'loading',
                    message:'Thinking...',
                    id:'1',
                    ai_message_id:newModelId
                  }
                ],
                sendStatus:'completed'
              } 
              setChatMessages(prev => [...prev,messag])
          }
          if(log.role==='thought' && log.message){
            setChatMessages(prev => {
                  return prev.map(msg => {
                    if (msg.id !== newModelId) return msg;

                    const existingTasks = msg.task ?? [];
                    const newTask: FunctionCall = {
                      name: "thought",
                      status: "loading",
                      message: log.message!,
                      id: 'thought',
                      ai_message_id: newModelId,
                    };

                    return {
                      ...msg,
                      task: [...existingTasks, newTask],
                    };
                  });
                });
          }

          if (log.role === "function-call" && log.message && log.name) {
                setChatMessages(prev => {
                  return prev.map(msg => {
                    if (msg.id !== newModelId) return msg;

                    const existingTasks = msg.task ?? [];
                    const newTask: FunctionCall = {
                      name: log.name ?? "Unknown",
                      status: "loading",
                      message: log.message!,
                      id: log.name??'Unknown',
                      ai_message_id: newModelId,
                    };

                    return {
                      ...msg,
                      task: [...existingTasks.filter(item  => item.name === 'thinking' || item.name === 'thought'), newTask],
                    };
                  });
                });
      }


          if (log.role === "function-response" && log.message && log.name) {
            setChatMessages(prev => prev.map(msg =>
              msg.id === newModelId
                ? {
                    ...msg,
                    task: msg.task?.map(task =>
                      task.name === log.name
                        ? { ...task, status: "completed" }
                        : task
                    ),
                  }
                : msg
            ))
          }

          if (log.role === "model-response" && log.message) {
            setChatMessages(prev => prev.map(msg => msg.id === newModelId ? { ...msg, sendStatus: "completed", content: log.message } : msg))
          }
          if(log.role === "error" && log.message){
            setChatMessages(prev => prev.map(msg => msg.id === newModelId ? { ...msg, sendStatus: "error", content: log.message } : msg))
          }
          if(log.role === 'chats' && log.data ){
            setApiMessages(log.data)
          }
        }
      }
    } catch (error) {
      console.log(error)
      setChatMessages(prev => prev.map(msg => msg.id === newUserId ? { ...msg, sendStatus: "error" } : msg))
      toast.error('Failed to send message')
    }
    setLoading(prev => ({...prev,newMessage:false}))


    
  }
  const handleCreateSession = async() => {
    setLoading(prev =>({...prev,newSession:true}))
    const res = await createSession(aiType)
    if(res.success && res.data){

      setCurrentConversationId(res.data.id)
      setActiveTab('chat')
      setApiMessages([
        
      ])
      setChatMessages([])
    }
    else{
      toast.success(res.error || 'Failed to create session')
    }
    setLoading(prev =>({...prev,newSession:false}))
  }
  useEffect(()=>{
    const fetch = async () => {
      setLoading(prev => ({...prev,conversation:true}))
      const sessionMessage = await loadSession(currentConversationId!)
    
      if(sessionMessage.success && sessionMessage.data){
        const filterMessage = sessionMessage.data
        // narrow type so TS knows content is a string
        .filter((item): item is typeof item & { content: string } => !!item.content)
        .map(item => ({
          id:        item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    role:      item.role,
    content:   item.content,    // now guaranteed string
    sessionId: item.sessionId,
  }));
    const chatMessages: ChatMessage[] = filterMessage
  // keep only model/user
  .filter(msg => msg.role === "model" || msg.role === "user")
  // flatMap: return [] to drop, or [msg] to keep
  .flatMap(msg => {
    try {
      const parsed = JSON.parse(msg.content)
      // drop arrays
      if (Array.isArray(parsed)) return []

      // keep single objects that have .text
      if (parsed && typeof parsed === "object" && "text" in parsed) {
        return [
          {
            id:        msg.id,
            type:      msg.role as "user" | "model",
            content:   String((parsed as any).text),
            timestamp: msg.createdAt,
          },
        ]
      }
    } catch {
      // invalid JSON → drop
    }
    return []
  })
  const S_filterMessage =  sessionMessage.data
        // narrow type so TS knows content is a string
        .filter((item): item is typeof item & { content: string } => !!item.content)
        .map(item => ({
          id:        item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    role:      item.role,
    content:   item.content,    // now guaranteed string
    sessionId: item.sessionId,
  }));
  const t_apiMessage = S_filterMessage.filter(item => item.role == 'user' || item.role == 'model').map(item => {
    return{
      role:item.role,
      parts:Array.isArray(JSON.parse(item.content)) ? JSON.parse(item.content) : [JSON.parse(item.content)]
    } as AcademicChatPrompt['messages'][0] 
  })
  // now TS knows chatMessages is ChatMessage[]
  setChatMessages(chatMessages)
  setApiMessages(t_apiMessage)
  setLoading(prev => ({...prev,conversation:false}))

      }
      else{
        toast.success(sessionMessage.error || 'Failed to load session')
      }
      setLoading(prev => ({...prev,conversation:false}))
    }
    if(currentConversationId){
      fetch()
    }
  },[currentConversationId])
  return (
    <div className={`fixed top-0 right-0 w-86 h-full max-h-screen shadow-lg bg-white transition-all ease-in-out ${open? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-gray-900" />
          <h3 className="font-semibold">AI Assistant</h3>
          <span  className=" bg-gray-100 text-gray-800  inline-flex items-center rounded-full cursor-pointer px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-100 focus:ring-offset-2">
            Online
          </span>
        </div>
        <button  className='h-9 px-3 rounded-md hover:bg-gray-100 hover:text-gray-900' onClick={() => setOpen(false)}>
          <X className="w-4 h-4"  />
        </button>
      </div>
      <div className="flex-1 flex flex-col">
  <div className="w-full grid grid-cols-2 mx-4 mt-2  h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500">
    <button
      className={`inline-flex items-center cursor-pointer justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2 ${
        activeTab === "chat" ? "bg-white text-gray-950 shadow-sm" : ""
      }`}
      onClick={() => setActiveTab("chat")}
    >
      <MessageSquare className="w-4 h-4" />
      Chat
    </button>
    <button
      className={`inline-flex items-center justify-center cursor-pointer whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2 ${
        activeTab === "history" ? "bg-white  text-gray-950 shadow-sm" : ""
      }`}
      onClick={() => setActiveTab("history")}
    >
      <History className="w-4 h-4" />
      History
    </button>
  </div>
</div>
<div className="flex flex-col justify-between h-full p-2 ">
 {
  loading.conversation ? (<div className="h-full w-full flex justify-center items-center">
   Loading chats... <LoaderCircle className='w-6 h-6 animate-spin duration-500'/>
  </div>):(<>
     {activeTab === "chat" && (
    <>
    {
      currentConversationId? <div className='h-full overflow-y-auto'><ChatMessages messages={chatMessages} isTyping={true}/></div> : <div className='h-full w-full flex justify-center items-center '><button disabled={loading.newSession} onClick={handleCreateSession} className ='w-full disabled:bg-gray-900/10 mx-6 py-2 rounded-lg bg-gray-900 cursor-pointer hover:scale-105 duration-500 text-white'>{loading.newSession ? "Creating Session..." : "New Chat"}</button></div>
    }
    </>
  )}
  {activeTab === "history" && <div className='h-full w-full px-4 py-2'><Conversation handleCreation={handleCreateSession} newSessionLoading={loading.newSession} setActiveId={(id)=>{
    if(id){
      setCurrentConversationId(id)
      setActiveTab('chat')
    }
    else{
      setCurrentConversationId(null)
      setActiveTab('history')
    }
  }} conversations={conversations} activeId={currentConversationId}/></div>}
  {activeTab == 'chat' && currentConversationId && 
    <form action="" onSubmit={handleSubmit} className='w-full shadow-lg border-1 flex flex-col mb-30 h-[125px] max-h-[125px] border-gray-100 rounded-lg'>
      <textarea name="" onChange={(e)=>setPrompt(e.target.value)} value={loading.newMessage ? '' : prompt} placeholder='Ask me any task...' rows={10} className='h-full text-gray-900 font-medium outline-0 p-2 resize-none' id=""></textarea>
    <div className="flex h-[50px]   w-full px-2 py-1 justify-end">
      <button  type='submit' disabled={prompt.length < 2 || loading.newMessage} className='p-2 bg-purple-600 disabled:opacity-50  text-white rounded-lg hover:bg-purple-700'>{loading.newMessage ? <LoaderCircle size={16} className='animate-spin duration-500'/> : <ArrowUp className="size-5" />}</button>
    </div>
    </form>
  }
  </>)
 }
</div>

    </div>
  )
}

export default ChatSideBar
