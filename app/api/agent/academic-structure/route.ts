import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Part, Content } from '@google/generative-ai';

import { tools as allTools } from './toolDefinition';
import { handleAction } from './toolDefinition';
import prisma from '@/app/lib/prisma';
import { AcademicAIAgent } from '@/app/ai/academic-agent';
import { AcademicChatPrompt } from './type';
import { coerce } from 'zod';

const API_KEY = process.env.GENERATIVE_API_KEY!;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function POST(request: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            function sendLog(log: any) {
                controller.enqueue(encoder.encode(JSON.stringify(log) + "\n"));
            }

            try {
                const { prompt,sessionId,messages,creatName } = await request.json() as AcademicChatPrompt ; 
                if (!prompt) {
                    sendLog({ role: 'error', message: 'Missing prompt' });
                    console.log({ role: 'error', message: 'Missing prompt' })
                    controller.close();
                    return;
                }
                
                if(creatName) {
                    const spropmt =  `Generate a concise and descriptive name for a chat session about the following: "${prompt}". The name should be short, ideally 3-7 words, and reflect the main topic. Avoid conversational phrases.`;

    const result = await model.generateContent(spropmt);
    const response = result.response.candidates?.[0]?.content.parts?.[0]?.text;
    let sessionName = '';
    if (response) {
        sessionName = response.trim();
    }

    // You might want to do some post-processing to ensure it's suitable
    // For example, remove extra newlines, quotes, or enforce character limits.
    const cleanSessionName = sessionName.replace(/^["'\s]+|["'\s]+$/g, '').replace(/\n/g, ' ');
    await prisma.aISession.update({
        where: {
            id: sessionId
        },
        data: {
            title: cleanSessionName
        }
    })
    console.log('sessionName', cleanSessionName);
    sendLog({log:'sessionName',message:cleanSessionName});
                }

                const AI_PERSONA_INSTRUCTION: Content = {
                    role: 'system',
                    parts: [
                        {
                            text: `You are Idriss, a helpful and efficient university AI system. Here you are incharged of helping users with their academic structure task that is program,level,semester. You assist users with academic administration tasks by utilizing the provided tools. Always introduce yourself as Idriss when appropriate, especially at the beginning of a conversation or if asked. Be polite and professional.
                
                                    When providing textual responses, adhere to the following formatting rules using custom tags:
                        - Wrap the entire response in '__RESPONSE__' and '__ENDRESPONSE__' tags.
                        - For paragraphs, use '__P__' and '__ENDP__' tags.
                        - For lists, start with '__LIST__', put '__ITEM__' before each list item and '__ENDITEM__' at the end of each item, and end with '__ENDLIST__'.
                        - For bold text, use '__BB__text__ENDBB__'.
                        - For underlined text, use '__UL__text__ENDUL__'.
                        - For emphasis or important notes, use '__EMPHASIS__text__ENDEMPHASIS__'.
                        - For code snippets or technical terms that should be monospace, use '__CODE__text__ENDCODE__'.
                        - Avoid putting unexisting tag it can failed in the parser like __ENDITEM__ or __EMPHASIS'.
                        - If two tags need to be joined add a spaced in the middle of the tags.
                        - Neve you put a closing tag without it opening e.g __ENDLIST__ without __LIST__ or __ENDP__ without __P__ and vice-versa .Always check that .
                        - All keys of a value should be bolded, e.g. '__BB__Program__ENDBB__: value'.
                        
                        Whenever you ask the user any question – for example, asking what task to perform, asking for confirmation, clarification, or greeting them with a question like “Hello, what should I help you with today?” – always end your question with '__ENDQUESTION__'. This tag does not require a matching opening tag. Never ask me a question without adding '__ENDQUESTION__'. It is mandatory.
                        Once you’ve completed all tasks or you want to answer a simple question, append the tag __ENDCONVERSATION__ at the very end of your final response. This is the only tag that does not require a matching opening tag.

                        Example of a list response:
                        __RESPONSE__
                        __P__Here are the items you requested:__ENDP__
                        __LIST__
                        __ITEM__First item__ENDITEM__.
                        __ITEM__Second item, which is __BB__very important__ENDBB__.__ENDITEM__
                        __ITEM__ Third item, __UL__underlined__UL__. __ENDITEM__
                        __ENDLIST__
                        __ENDRESPONSE__
                    
                        Example of a question response:
                        __RESPONSE__
                        __P__Hello, how can I help you today?__ENDP__
                        __ENDRESPONSE__
                        __ENDQUESTION__

                        When creating children entity like level or semester where level is the child of program and semester is a child of level always,
                        the user should provide thier code because is a unique field,if he doesn't provide it ask for it 
    
                `}
                    ]
                };
                
                const chatHistory: Content[] = [
                    ...messages,
                    { role: 'user', parts: [{ text: prompt }] },
                ];
                await prisma.aISession.update({
                    where: {
                        id: sessionId
                    },
                    data: {
                        
                        messages:{
                            create:{
                                role:'user',
                                content:JSON.stringify({text:prompt})
                            }
                        }
                    }
                })
                sendLog({role:'user-message-recieve',message:prompt});
                console.log('user message recive')
                let loopCounter = 0;
                const MAX_LOOP_ITERATIONS = 7;
                

                while (loopCounter < MAX_LOOP_ITERATIONS) {
                    sendLog({ role: 'log', message: `--- Loop iteration: ${loopCounter} ---` });
                    sendLog({ role: 'log', message: 'Current chat history', data: chatHistory });

                    const result = await model.generateContent({
                        contents: chatHistory,
                        tools: allTools,
                        systemInstruction: AI_PERSONA_INSTRUCTION
                    });

                    const responseContent = result.response.candidates?.[0]?.content;

                    if (!responseContent || !responseContent.parts || responseContent.parts.length === 0) {
                        sendLog({ role: 'error', message: "Model returned no content parts. Ending loop." });
                        controller.close();
                        return;
                    }

                    const functionCallParts: Part[] = [];
                    const textParts: Part[] = [];

                    for (const part of responseContent.parts) {
                        if (part.functionCall) {
                            functionCallParts.push(part);
                        } else if (part.text) {
                            textParts.push(part);
                        }
                    }

                    // Handle function calls
                    if (functionCallParts.length > 0) {
                        sendLog({ role: 'function-call-number', message: `Model requested ${functionCallParts.length} function call(s).`, data: functionCallParts });

                        chatHistory.push({ role: 'model', parts: functionCallParts });
                        await prisma.aISession.update({
                            where: {
                                id: sessionId
                            },
                            data: {
                                messages: {
                                    create: {
                                        role: 'model',
                                        content: JSON.stringify(functionCallParts)
                                    }
                                }
                            }
                        })

                        const functionResponses: Part[] = [];
                        for (const fnPart of functionCallParts) {
                            const fn = fnPart.functionCall!;
                            sendLog({ role: 'function-call', message: `Executing function: ${fn.name}`, args: fn.args,name:fn.name });

                            let actionResult: any;
                            try {
                                actionResult = await handleAction(fn.name, fn.args);
                                sendLog({ role: 'function-response', message: `Function '${fn.name}' executed`, result: actionResult,name:fn.name });
                            } catch (actionError: any) {
                                sendLog({ role: 'error', message: `Error executing function '${fn.name}'`, error: actionError.message });
                                actionResult = { error: actionError.message || `Failed to execute ${fn.name}` };
                                sendLog({role:'chats',data:chatHistory})
                                controller.close()
                                return;
                            }

                            const functionResponsePart = {
                                functionResponse: {
                                    name: fn.name,
                                    response: actionResult,
                                },
                            };

                            functionResponses.push(functionResponsePart);

                            // // Stream each function response as a chunk
                            // sendLog({ role: 'function-response', name: fn.name, response: actionResult });
                        }

                        chatHistory.push({
                            role: 'function',
                            parts: functionResponses,
                        });

                        await prisma.aISession.update({
                            where: {
                                id: sessionId
                            },
                            data: {
                                messages: {
                                    create: {
                                        role: 'function',
                                        content: JSON.stringify(functionResponses)
                                    }
                                }
                            }
                        })

                        loopCounter++;
                    }
                    // Handle model text responses
                    else if (textParts.length > 0) {
                        const combinedText = textParts.map(p => p.text).join('\n');
                        chatHistory.push({ role: 'model', parts: [{ text: combinedText }] });
                        await prisma.aISession.update({
                            where: {
                                id: sessionId
                            },
                            data: {
                                messages: {
                                    create: {
                                        role: 'model',
                                        content: JSON.stringify({text:combinedText})
                                    }
                                }
                            }
                        })
                        if(combinedText.includes("__ENDCONVERSATION__")||combinedText.includes("__ENDQUESTION__")){
                            sendLog({ role: 'model-response', message: combinedText });
                            console.log(chatHistory)
                            sendLog({role:'chats',data:chatHistory})
                            controller.close();
                            return ;
                        }
                        chatHistory.push({role:'user',parts:[{text:'ok continue'}]})
                        sendLog({role:'thought',message:combinedText})
                        loopCounter++

                        // console.log(chatHistory)
                        // sendLog({role:'chats',data:chatHistory})
                        // controller.close();
                        // return ;
                    }
                    // Fallback if neither
                    else {
                        sendLog({ role: 'error', message: "Model response was neither a function call nor text. Ending loop." });
                        sendLog({role:'chats',data:chatHistory})
                        controller.close();
                        return;
                    }
                }

                sendLog({ role: 'error', message: "Max loop iterations reached without a final text response." });
                sendLog({role:'chats',data:chatHistory})
                controller.close();

            } catch (err: any) {
                sendLog({ role: 'error', message: err.message || 'Server error' });
                controller.close();
            }
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Transfer-Encoding": "chunked",
        },
    });
}
