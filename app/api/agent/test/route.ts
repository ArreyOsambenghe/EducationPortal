// // app/api/agentAcademic/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import Together from 'together-ai';
// import { academicTools, academicToolFunctions, AcademicToolName } from '@/app/api/agent/academic-structure/toolDefinition';

// /**
//  * Allowed roles in the conversation
//  */
// type AllowedRole = 'system' | 'user' | 'assistant' | 'tool';

// /**
//  * Message shape for conversation history
//  */
// type Message = {
//   role: AllowedRole;
//   content: string;
//   tool_call_id?: string;
// };

// export async function POST(req: NextRequest) {
//   // Parse incoming JSON body
//   const { question } = await req.json() as { question:string};

//   const messages: Message[] = [
//     { role: 'system', content: `You are an academic structure agent. 
// You have access to tools to manage programs, levels, and semesters.
// IMPORTANT:
// - Never simulate actions or results.
// - If a user requests creation of an entity that depends on another entity (e.g. creating a level under a program), and you do not have the required ID, you MUST first call the appropriate tool (e.g. list_programs) to retrieve it.
// - ALWAYS use tool calls to retrieve real data before taking any action.
// - NEVER reply with explanations or plans without first performing the needed tool calls.
// Return only final user-facing responses when your actions are complete.
// If unsure, call a tool to check. 

// EXAMPLES:
//   You are an academic structure agent. 
// You have access to tools to manage programs, levels, and semesters.
// IMPORTANT:
// - Never simulate actions or results.
// - If a user requests creation of an entity that depends on another entity (e.g. creating a level under a program), and you do not have the required ID, you MUST first call the appropriate tool (e.g. list_programs) to retrieve it.
// - ALWAYS use tool calls to retrieve real data before taking any action.
// - NEVER reply with explanations or plans without first performing the needed tool calls.
// Return only final user-facing responses when your actions are complete.
// If unsure, call a tool to check.
// `},
//     { role: 'user', content: question }
//   ];

//   const together = new Together({ apiKey: process.env.TOGETHER_API_KEY! });

//   // Clone history to append new messages
//   const history: Message[] = [...messages];

//   while (true) {
//     // 1) Call the model with current history and tool definitions
//     const response = await together.chat.completions.create({
//       model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
//       messages: history,
//       tools: academicTools,
//       tool_choice: 'auto'
//     });

//     const choice = response.choices[0];
//     const msg = choice.message;

//     // 2) If no tool calls are requested, return final assistant message
//     if (!msg || !msg.tool_calls || msg.tool_calls.length === 0) {
//       const finalContent = msg?.content ?? '';
//       history.push({ role: 'system', content: finalContent });
//       return NextResponse.json({ reply: finalContent, history });
//     }

//     // 3) Process each tool call sequentially
//     for (const call of msg.tool_calls) {
//       const name = call.function.name as AcademicToolName;
//       const args = JSON.parse(call.function.arguments) as any;
//       const impl = academicToolFunctions[name]?.implementation;
//       if (!impl) {
//         throw new Error(`No implementation for tool ${name}`);
//       }

//       // 4) Execute the tool and append result
//       const result = await impl(args);
//       history.push({ role: 'tool', content: JSON.stringify(result), tool_call_id: call.id });
//     }

//     // 5) Loop: agent will see tool results and decide next action
//   }
// }
