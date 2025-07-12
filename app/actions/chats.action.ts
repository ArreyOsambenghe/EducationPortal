'use server'
import { revalidatePath } from "next/cache"
import { AcademicChatPrompt } from "../api/agent/academic-structure/type"
import { AIMessage, AISession, AITYPE } from "../generated/prisma"
import prisma from "../lib/prisma"
import { ActionResult, createActionResult } from "./base-actions"
export const createSession = async (aiType:AITYPE) : Promise<ActionResult<AISession>> => {
    try{
        const session  = await prisma.aISession.create({
        data:{
            aiType:aiType,
            messages:{
                create:[{
                    role:'model',
                    content:JSON.stringify({text:`__RESPONSE__
__P__Hello, I am Idriss, your university AI assistant. How can I help you today?__ENDP__
__ENDRESPONSE__
__ENDQUESTION__`})
                }]
            }
        }
    })
    if(aiType == 'ACADEMIC'){
        revalidatePath('/test/test2')
    }

    return createActionResult(true,session)
    }catch(error){
        console.log(error)
        return {success:false,error:"Failed to create session"}
    }

}
export async function verifySessionTitle(id:string){
    const res = await prisma.aISession.findUnique({
        where:{id},
        select:{
            title:true
        }
    })

    if(res && res.title && res.title !== null){
        return true
    }
    return false
}

export const loadAllSessions = async (aiType:AITYPE):Promise<ActionResult<(AISession & {messages:AIMessage[]})[]>> =>  {
   try {
     const allSession = await prisma.aISession.findMany({
        where:{aiType:aiType},
        include:{
            messages:true
        }
        
    })
    const sortedSession = allSession.sort((a, b) => {
  const dateA = new Date(a.updatedAt ?? a.createdAt).getTime();
  const dateB = new Date(b.updatedAt ?? b.createdAt).getTime();
  return dateB - dateA;
});
    return createActionResult(true,sortedSession)

   } catch (error) {
     console.log(error)
    return {success:false,error:"Failed to load session"}
   }

}

export const loadSession = async (sessionId:string): Promise<ActionResult<AIMessage[]>> => {
    try{
        const session = await prisma.aISession.findUnique({
            where:{id:sessionId},
            include:{
                messages:true
            }
        })
        if(!session){
            return {success:false,error:"Session not found"}
        }
        
        return createActionResult(true,session.messages)
    }catch(error){
        console.log(error)
        return {success:false,error:"Failed to load session"}
    }
}