'use server'
// lib/toolDefinitions.ts

/**
 * Type-safe definitions of tools and their implementations for testing.
 */

type ParametersSchema = {
  type: "object";
  properties: Record<string, { type: string; description: string }>;
  required: string[];
};

/**
 * Interface for a single tool function entry.
 */
export interface ToolDefinition<Params extends Record<string, any>, Result> {
  description: string;
  parameters: ParametersSchema;
  implementation: (args: Params) => Promise<Result>;
}

/**
 * Mapping of function names to their definitions.
 */
export const toolFunctions = {
  get_current_weather: {
    description: "Get the current weather in a city",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name" }
      },
      required: ["location"]
    },
    implementation: async (
      args: { location: string }
    ): Promise<{ location: string; temperature: string; condition: string }> => {
      // Dummy implementation: return fake weather data
      return {
        location: args.location,
        temperature: `${Math.floor(Math.random() * 15) + 15}°C`, // random 15–30°C
        condition: "Sunny"
      };
    }
  } as ToolDefinition<{ location: string }, { location: string; temperature: string; condition: string }> ,

  translate_text: {
    description: "Translate text to a specified language",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to translate" },
        target_language: { type: "string", description: "Target language code, e.g., 'fr', 'es'" }
      },
      required: ["text", "target_language"]
    },
    implementation: async (
      args: { text: string; target_language: string }
    ): Promise<{ translated: string; target_language: string }> => {
      // Dummy: reverse the text to simulate translation
      const translated = args.text.split('').reverse().join('');
      return { translated, target_language: args.target_language };
    }
  } as ToolDefinition<{ text: string; target_language: string }, { translated: string; target_language: string }> ,

  get_stock_price: {
    description: "Fetch the current stock price for a given symbol",
    parameters: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Stock ticker symbol" }
      },
      required: ["symbol"]
    },
    implementation: async (
      args: { symbol: string }
    ): Promise<{ symbol: string; price: string }> => {
      // Dummy: return a random price
      return {
        symbol: args.symbol,
        price: (Math.random() * 1000).toFixed(2)
      };
    }
  } as ToolDefinition<{ symbol: string }, { symbol: string; price: string }> ,

  set_reminder: {
    description: "Set a reminder with a message at a given time",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string", description: "Reminder message" },
        time: { type: "string", description: "ISO timestamp for the reminder" }
      },
      required: ["message", "time"]
    },
    implementation: async (
      args: { message: string; time: string }
    ): Promise<{ status: string; message: string; time: string }> => {
      // Dummy: echo confirmation
      return {
        status: "scheduled",
        message: args.message,
        time: args.time
      };
    }
  } as ToolDefinition<{ message: string; time: string }, { status: string; message: string; time: string }>  
} as const;

/**
 * Together AI tool definitions in OpenAI function call format.
 */
export const tools = Object.entries(toolFunctions).map(
  ([name, def]) => ({
    type: "function" as const,
    function: {
      name,
      description: def.description,
      parameters: def.parameters
    }
  })
);

export type ToolName = keyof typeof toolFunctions;
export type ToolImplementation<T extends ToolName> = typeof toolFunctions[T];
