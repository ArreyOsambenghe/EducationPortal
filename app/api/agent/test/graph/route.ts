// import { NextRequest, NextResponse } from 'next/server';
// import {
//   GoogleGenerativeAI,
//   FunctionDeclaration,
//   Tool,
//   SchemaType,
//   Part,
//   Content,
// } from '@google/generative-ai';

// // Initialize GenAI client (API key injected in runtime environment)
// const API_KEY = process.env.GENERATIVE_API_KEY!;
// const genAI = new GoogleGenerativeAI(API_KEY);
// const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// // Tool: getCurrentWeather declaration and implementation
// interface WeatherData {
//   location: string;
//   temperature: number;
//   unit: 'celsius' | 'fahrenheit';
//   condition: string;
// }

// async function getCurrentWeather(location: string): Promise<WeatherData> {
//   console.log(`Calling getCurrentWeather for: ${location}`);
//   if (location.toLowerCase().includes('london')) {
//     return { location: 'London', temperature: 15, unit: 'celsius', condition: 'Cloudy' };
//   }
//   if (location.toLowerCase().includes('paris')) {
//     return { location: 'New York', temperature: 22, unit: 'fahrenheit', condition: 'Sunny' };
//   }
//   return { location, temperature: 20, unit: 'celsius', condition: 'Unknown' };
// }

// // Example of a second tool for demonstrating chained calls
// interface PlaceData {
//   name: string;
//   population: number;
//   country: string;
// }

// async function getCityPopulation(cityName: string): Promise<PlaceData> {
//   console.log(`Calling getCityPopulation for: ${cityName}`);
//   if (cityName.toLowerCase().includes('paris')) {
//     return { name: 'Paris', population: 2141000, country: 'France' };
//   }
//   if (cityName.toLowerCase().includes('tokyo')) {
//     return { name: 'Tokyo', population: 13960000, country: 'Japan' };
//   }
//   return { name: cityName, population: 0, country: 'Unknown' };
// }


// const getCurrentWeatherFunction: FunctionDeclaration = {
//   name: 'getCurrentWeather',
//   description: 'Gets the current weather for a specified location.',
//   parameters: {
//     type: SchemaType.OBJECT,
//     properties: {
//       location: { type: SchemaType.STRING, description: 'City or location name.' },
//     },
//     required: ['location'],
//   },
// };

// const getCityPopulationFunction: FunctionDeclaration = {
//     name: 'getCityPopulation',
//     description: 'Gets the population of a specified city.',
//     parameters: {
//         type: SchemaType.OBJECT,
//         properties: {
//             cityName: { type: SchemaType.STRING, description: 'The name of the city.' },
//         },
//         required: ['cityName'],
//     },
// };


// const allTools: Tool[] = [
//   { functionDeclarations: [getCurrentWeatherFunction] },
//   { functionDeclarations: [getCityPopulationFunction] },
// ];

// export async function POST(request: NextRequest) {
//   try {
//     const { prompt } = await request.json();
//     if (!prompt) {
//       return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
//     }

//     const chatHistory: Content[] = [
//       { role: 'user', parts: [{ text: prompt }] },
//     ];

//     let loopCounter = 0;
//     const MAX_LOOP_ITERATIONS = 10;

//     while (loopCounter < MAX_LOOP_ITERATIONS) {
//       console.log(`Loop iteration: ${loopCounter}`);
//       console.log('Current chat history:', JSON.stringify(chatHistory, null, 2));

//       const result = await model.generateContent({
//         contents: chatHistory,
//         tools: allTools,
//       });

//       const responseContent = result.response.candidates?.[0]?.content;

//       // Check if the model's response contains ANY parts, regardless of type
//       if (!responseContent || !responseContent.parts || responseContent.parts.length === 0) {
//           console.log('Model returned no content parts. Ending loop.');
//           return NextResponse.json({ result: "I couldn't process that request fully. The model provided no discernible response." });
//       }

//       const functionCalls: Part[] = [];
//       const textParts: Part[] = [];

//       // Separate function calls from text responses in the current turn
//       for (const part of responseContent.parts) {
//         if (part.functionCall) {
//           functionCalls.push(part);
//         } else if (part.text) {
//           textParts.push(part);
//         }
//       }

//       if (functionCalls.length > 0) {
//         console.log(`Model requested ${functionCalls.length} function call(s).`);

//         // Add the model's tool request(s) to chat history (as a single 'model' turn)
//         chatHistory.push({ role: 'model', parts: functionCalls });

//         const functionResponses: Part[] = [];
//         for (const fnPart of functionCalls) {
//           const fn = fnPart.functionCall!; // We know it's a functionCall here
//           console.log(`Executing function: ${fn.name} with args:`, fn.args);

//           let functionResult: any;
//           if (fn.name === 'getCurrentWeather') {
//             const location = (fn.args as { location: string }).location;
//             functionResult = await getCurrentWeather(location);
//           } else if (fn.name === 'getCityPopulation') {
//             const cityName = (fn.args as { cityName: string }).cityName;
//             functionResult = await getCityPopulation(cityName);
//           } else {
//             console.warn(`Unknown function call requested: ${fn.name}`);
//             functionResult = { error: `Unknown function: ${fn.name}` };
//           }

//           console.log(`Function result for ${fn.name}:`, functionResult);

//           functionResponses.push({
//             functionResponse: {
//               name: fn.name,
//               response: functionResult,
//             },
//           });
//         }

//         // Add ALL function responses to chat history as a single 'function' turn
//         chatHistory.push({
//           role: 'function',
//           parts: functionResponses,
//         });

//         loopCounter++; // Increment loop counter, and continue for next model turn
//       } else if (textParts.length > 0) {
//         // If the model's response is text, it means it's done or giving a direct answer
//         console.log('Model responded with text. Ending loop.');
//         const combinedText = textParts.map(p => p.text).join('\n');
//         chatHistory.push({ role: 'model', parts: [{ text: combinedText }] }); // Store final text
//         return NextResponse.json({ result: combinedText });
//       } else {
//         // Fallback for unexpected model output
//         console.log('Model response was neither a function call nor text. Ending loop.');
//         return NextResponse.json({ result: "I couldn't get a clear response. Please try again." });
//       }
//     }

//     // If the loop finishes without a text response (e.g., hit MAX_LOOP_ITERATIONS)
//     console.warn('Max loop iterations reached without a final text response.');
//     // Try to extract any final text from the last model turn, if available
//     const finalResponseCandidate = chatHistory[chatHistory.length - 1];
//     if (finalResponseCandidate?.role === 'model' && finalResponseCandidate.parts?.length > 0) {
//       const lastText = finalResponseCandidate.parts.map(p => p.text).join('\n');
//       if (lastText.trim()) {
//         return NextResponse.json({ result: lastText });
//       }
//     }
//     return NextResponse.json({ result: "I encountered a complex situation and couldn't provide a direct answer within the allowed turns. Can you rephrase?" });

//   } catch (err: any) {
//     console.error('Error in route:', err);
//     return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Part, Content } from '@google/generative-ai';

// Import your tool definitions and the central action handler
import { tools as allTools } from './toolDefinition'; // Assuming tools.ts is in lib/
import { handleAction } from './toolDefinition'; // Assuming handleAction.ts is in lib/

// Initialize GenAI client
// The API_KEY is expected to be injected in the runtime environment (e.g., via .env.local)
const API_KEY = process.env.GENERATIVE_API_KEY!;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function POST(request: NextRequest) {
  
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }
    const AI_PERSONA_INSTRUCTION: Content = {
  role: 'system',
  parts: [
    { text: 'You are Idriss, a helpful and efficient university AI system. Here you are incharged of helping users with their academic structure task that is program,level,semester. You assist users with academic administration tasks by utilizing the provided tools. Always introduce yourself as Idriss when appropriate, especially at the beginning of a conversation or if asked. Be polite and professional. ' }
  ]
};

    // Initialize chat history with the user's initial prompt
    // This array will accumulate the conversation turns (user, model tool calls, function responses)
    const chatHistory: Content[] = [
      { role: 'user', parts: [{ text: prompt }] },
    ];

    let loopCounter = 0;
    const MAX_LOOP_ITERATIONS = 7; // Set a reasonable limit to prevent infinite loops

    // Main loop for multi-turn tool interaction
    while (loopCounter < MAX_LOOP_ITERATIONS) {
      console.log(`--- Loop iteration: ${loopCounter} ---`);
      console.log('Current chat history:', JSON.stringify(chatHistory, null, 2));

      // Step 1: Send the current chat history and available tools to the Gemini model
      const result = await model.generateContent({
        contents: chatHistory,
        tools: allTools, // Provide all defined tools to the model
        systemInstruction: AI_PERSONA_INSTRUCTION
      });

      const responseContent = result.response.candidates?.[0]?.content;

      // Check if the model returned any content parts (function calls or text)
      if (!responseContent || !responseContent.parts || responseContent.parts.length === 0) {
        console.log('Model returned no content parts. Ending loop.');
        return NextResponse.json({ result: "I couldn't process that request fully. The model provided no discernible response." });
      }

      // Separate function call parts from text parts in the model's current response
      const functionCallParts: Part[] = [];
      const textParts: Part[] = [];

      for (const part of responseContent.parts) {
        if (part.functionCall) {
          functionCallParts.push(part);
        } else if (part.text) {
          textParts.push(part);
        }
      }

      // Step 2: Process function calls if the model requested any
      if (functionCallParts.length > 0) {
        console.log(`Model requested ${functionCallParts.length} function call(s).`);

        // Add the model's tool request(s) to chat history as a single 'model' turn
        chatHistory.push({ role: 'model', parts: functionCallParts });

        const functionResponses: Part[] = [];
        const [functionResults] = await Promise.all(
          functionCallParts.map(async (fnPart) => {
            const fn = fnPart.functionCall!; // Assert non-null as we've checked it's a functionCall
            console.log(`Executing function: ${fn.name} with args:`, fn.args);

            let actionResult: any;
            try {
              // Execute the action using your central handleAction function
              actionResult = await handleAction(fn.name, fn.args);
              console.log(`Function '${fn.name}' result:`, actionResult);
            } catch (actionError: any) {
              console.error(`Error executing function '${fn.name}':`, actionError);
              actionResult = { error: actionError.message || `Failed to execute ${fn.name}` };
            }

            // Add the function's response to the list of responses for this turn
            functionResponses.push({
              functionResponse: {
                name: fn.name,
                response: actionResult, // The result from your handleAction
              },
            })
        }))
        // for (const fnPart of functionCallParts) {
        //   const fn = fnPart.functionCall!; // Assert non-null as we've checked it's a functionCall
        //   console.log(`Executing function: ${fn.name} with args:`, fn.args);

        //   let actionResult: any;
        //   try {
        //     // Execute the action using your central handleAction function
        //     actionResult = await handleAction(fn.name, fn.args);
        //     console.log(`Function '${fn.name}' result:`, actionResult);
        //   } catch (actionError: any) {
        //     console.error(`Error executing function '${fn.name}':`, actionError);
        //     actionResult = { error: actionError.message || `Failed to execute ${fn.name}` };
        //   }

        //   // Add the function's response to the list of responses for this turn
        //   functionResponses.push({
        //     functionResponse: {
        //       name: fn.name,
        //       response: actionResult, // The result from your handleAction
        //     },
        //   });
        // }

        // Add ALL function responses to chat history as a single 'function' turn
        chatHistory.push({
          role: 'function',
          parts: functionResponses,
        });

        loopCounter++; // Increment loop counter and continue for the next model turn
      }
      // Step 3: If no function calls, check for a final text response
      else if (textParts.length > 0) {
        console.log('Model responded with text. Ending loop.');
        const combinedText = textParts.map(p => p.text).join('\n');
        // Add the model's final text response to history for completeness
        chatHistory.push({ role: 'model', parts: [{ text: combinedText }] });
        return NextResponse.json({ result: combinedText });
      } else {
        // Fallback for unexpected model output (neither function call nor text)
        console.log('Model response was neither a function call nor text. Ending loop.');
        return NextResponse.json({ result: "I received an unclear response from the AI. Please try rephrasing your request." });
      }
    }

    // Step 4: Handle cases where the loop finishes without a final text response
    // This typically means MAX_LOOP_ITERATIONS was reached, or the model got stuck
    console.warn('Max loop iterations reached without a final text response.');
    // Attempt to extract the last text part from the history if available
    const lastModelTurn = chatHistory.findLast(content => content.role === 'model');
    if (lastModelTurn && lastModelTurn.parts?.length > 0) {
      const lastTextPart = lastModelTurn.parts.find(part => part.text);
      if (lastTextPart?.text && lastTextPart.text.trim()) {
        return NextResponse.json({ result: lastTextPart.text });
      }
    }
    return NextResponse.json({ result: "I encountered a complex situation and couldn't provide a complete answer within the allowed steps. Can you provide more details or simplify your request?" });

  } catch (err: any) {
    console.error('Error in route:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
