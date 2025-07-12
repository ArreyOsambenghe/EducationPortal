import { Part } from "@google/generative-ai"

export type AcademicChatPrompt = {
    prompt:string,
    sessionId:string,
    messages:{
        role:'user'|'model'|'function',
        parts:Part[]
    }[],
    creatName?:boolean
}