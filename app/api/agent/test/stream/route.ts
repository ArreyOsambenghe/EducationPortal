import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Part, Content } from '@google/generative-ai';

import { tools as allTools } from '../graph/toolDefinition';
import { handleAction } from '../graph/toolDefinition';

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
                const { prompt } = await request.json();
                if (!prompt) {
                    sendLog({ role: 'error', message: 'Missing prompt' });
                    controller.close();
                    return;
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

                        Example of a list response:
                        __RESPONSE__
                        __P__Here are the items you requested:__ENDP__
                        __LIST__
                        __ITEM__First item__ENDITEM__.
                        __ITEM__Second item, which is __BB__very important__ENDBB__.__ENDITEM__
                        __ITEM__ Third item, __UL__underlined__UL__. __ENDITEM__
                        __ENDLIST__
                        __ENDRESPONSE__
    
                `}
                    ]
                };

                const chatHistory: Content[] = [
                    { role: 'user', parts: [{ text: prompt }] },
                ];

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
                        sendLog({ role: 'function-call', message: `Model requested ${functionCallParts.length} function call(s).`, data: functionCallParts });

                        chatHistory.push({ role: 'model', parts: functionCallParts });

                        const functionResponses: Part[] = [];
                        for (const fnPart of functionCallParts) {
                            const fn = fnPart.functionCall!;
                            sendLog({ role: 'function-call', message: `Executing function: ${fn.name}`, args: fn.args });

                            let actionResult: any;
                            try {
                                actionResult = await handleAction(fn.name, fn.args);
                                sendLog({ role: 'function-response', message: `Function '${fn.name}' result`, result: actionResult });
                            } catch (actionError: any) {
                                sendLog({ role: 'error', message: `Error executing function '${fn.name}'`, error: actionError.message });
                                actionResult = { error: actionError.message || `Failed to execute ${fn.name}` };
                            }

                            const functionResponsePart = {
                                functionResponse: {
                                    name: fn.name,
                                    response: actionResult,
                                },
                            };

                            functionResponses.push(functionResponsePart);

                            // Stream each function response as a chunk
                            sendLog({ role: 'function-response', name: fn.name, response: actionResult });
                        }

                        chatHistory.push({
                            role: 'function',
                            parts: functionResponses,
                        });

                        loopCounter++;
                    }
                    // Handle model text responses
                    else if (textParts.length > 0) {
                        const combinedText = textParts.map(p => p.text).join('\n');
                        sendLog({ role: 'model-response', message: combinedText });

                        chatHistory.push({ role: 'model', parts: [{ text: combinedText }] });

                        controller.close();
                        return;
                    }
                    // Fallback if neither
                    else {
                        sendLog({ role: 'error', message: "Model response was neither a function call nor text. Ending loop." });
                        controller.close();
                        return;
                    }
                }

                sendLog({ role: 'error', message: "Max loop iterations reached without a final text response." });
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
